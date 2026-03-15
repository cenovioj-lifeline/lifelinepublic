import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { QuoteSubmissionDialog } from "@/components/QuoteSubmissionDialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { generateInitials, generateAvatarColor } from "@/lib/avatarUtils";
import { ContributionButton } from "@/components/ContributionButton";
import { ContributionStatusBadge } from "@/components/ContributionStatusBadge";
import { EditQuoteContributionDialog } from "@/components/EditQuoteContributionDialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function CollectionQuotes() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);

  const { data: collection } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["collection-quotes", collection?.id, selectedAuthor, user?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      let query = supabase
        .from("collection_quotes")
        .select(`
          *,
          author_profile:profiles!author_profile_id(
            id,
            name,
            slug,
            avatar_image:media_assets!avatar_image_id(
              url,
              alt_text,
              position_x,
              position_y,
              scale
            )
          )
        `)
        .eq("collection_id", collection.id);

      // Filter visibility based on user
      if (user) {
        query = query.or(
          `contribution_status.in.(approved,auto_approved),contributed_by_user_id.eq.${user.id}`
        );
      } else {
        query = query.in('contribution_status', ['approved', 'auto_approved']);
      }

      if (selectedAuthor !== "all") {
        query = query.eq("author", selectedAuthor);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!collection?.id,
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from("collection_quotes")
        .delete()
        .eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-quotes"] });
      toast.success("Quote deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete quote");
    },
  });

  // Get unique authors for filter
  const authors = [...new Set(quotes?.map((q) => q.author).filter(Boolean))].sort();

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div>Loading...</div>
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: "hsl(var(--scheme-profile-text))" }}>Quotes</h1>
            <p className="text-lg" style={{ color: "hsl(var(--scheme-profile-text))", opacity: 0.7 }}>
              Memorable quotes from {collection.title}
            </p>
          </div>
          <ContributionButton
            context="quotes"
            collectionId={collection.id}
            collectionTitle={collection.title}
          />
        </div>

        {/* Filter */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium" style={{ color: "hsl(var(--scheme-profile-text))", opacity: 0.7 }}>Filter by:</label>
          <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All authors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authors</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author} value={author || ""}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quotes Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading quotes...</div>
        ) : quotes && quotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {quotes.map((quote) => {
              const isOwnPending = quote.contributed_by_user_id === user?.id && 
                                   ['pending', 'rejected'].includes(quote.contribution_status || '');
              
              return (
                <Card
                  key={quote.id}
                  style={{
                    borderColor: "hsl(var(--scheme-cards-border))",
                    backgroundColor: "hsl(var(--scheme-cards-bg))",
                  }}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-6 space-y-3">
                    {quote.contributed_by_user_id === user?.id && quote.contribution_status !== 'approved' && (
                      <ContributionStatusBadge 
                        status={quote.contribution_status || 'pending'}
                        adminMessage={quote.admin_message}
                      />
                    )}
                    <p className="text-lg italic mb-4" style={{ color: "hsl(var(--scheme-cards-text))" }}>"{quote.quote}"</p>
                    {(quote.author || quote.author_profile) && (
                      <div className="flex items-center gap-3">
                        {quote.author_profile && (
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={quote.author_profile.avatar_image?.url} 
                              alt={quote.author_profile.avatar_image?.alt_text || quote.author_profile.name}
                              style={{
                                objectPosition: `${quote.author_profile.avatar_image?.position_x ?? 50}% ${quote.author_profile.avatar_image?.position_y ?? 50}%`,
                                transform: `scale(${quote.author_profile.avatar_image?.scale ?? 1})`,
                                transformOrigin: `${quote.author_profile.avatar_image?.position_x ?? 50}% ${quote.author_profile.avatar_image?.position_y ?? 50}%`
                              }}
                            />
                            <AvatarFallback style={{ backgroundColor: generateAvatarColor(quote.author_profile.name) }}>
                              {generateInitials(quote.author_profile.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <p
                            className="text-sm font-semibold mb-1"
                            style={{ color: "hsl(var(--scheme-title-text))" }}
                          >
                            — {quote.author_profile?.name || quote.author}
                          </p>
                          {quote.context && (
                            <p className="text-xs" style={{ color: "hsl(var(--scheme-cards-text))" }}>{quote.context}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {isOwnPending && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingQuote(quote)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this quote?")) {
                              deleteQuoteMutation.mutate(quote.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card
            style={{
              borderColor: "hsl(var(--scheme-cards-border))",
              backgroundColor: "hsl(var(--scheme-cards-bg))",
            }}
          >
            <CardContent className="pt-6 text-center py-12">
              <p style={{ color: "hsl(var(--scheme-cards-text))" }}>
                No quotes found. Be the first to submit one!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <QuoteSubmissionDialog
        open={submissionDialogOpen}
        onOpenChange={setSubmissionDialogOpen}
        collectionId={collection.id}
        collectionTitle={collection.title}
        onSignInRequired={() => {
          setSubmissionDialogOpen(false);
          navigate("/auth");
        }}
      />

      {editingQuote && (
        <EditQuoteContributionDialog
          open={!!editingQuote}
          onOpenChange={(open) => !open && setEditingQuote(null)}
          quoteId={editingQuote.id}
          initialQuote={editingQuote.quote}
          initialAuthor={editingQuote.author}
          initialContext={editingQuote.context}
        />
      )}
    </CollectionLayout>
  );
}

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
import { Plus } from "lucide-react";
import { generateInitials, generateAvatarColor } from "@/lib/avatarUtils";

export default function CollectionQuotes() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);

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
    queryKey: ["collection-quotes", collection?.id, selectedAuthor],
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
              alt_text
            )
          )
        `)
        .eq("collection_id", collection.id)
        .order("created_at", { ascending: false });

      if (selectedAuthor !== "all") {
        query = query.eq("author", selectedAuthor);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!collection?.id,
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
            <h1 className="text-4xl font-bold mb-2" style={{ color: "hsl(var(--scheme-title-text))" }}>Quotes</h1>
            <p className="text-lg" style={{ color: "hsl(var(--scheme-cards-text))" }}>
              Memorable quotes from {collection.title}
            </p>
          </div>
          <Button
            onClick={() => setSubmissionDialogOpen(true)}
            style={{ backgroundColor: collection.primary_color || undefined }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Quote
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium" style={{ color: "hsl(var(--scheme-cards-text))" }}>Filter by:</label>
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
            {quotes.map((quote) => (
              <Card
                key={quote.id}
                style={{
                  borderColor: "hsl(var(--scheme-card-border))",
                  backgroundColor: "hsl(var(--scheme-card-bg))",
                }}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <p className="text-lg italic mb-4" style={{ color: "hsl(var(--scheme-cards-text))" }}>"{quote.quote}"</p>
                  {(quote.author || quote.author_profile) && (
                    <div className="flex items-center gap-3">
                      {quote.author_profile && (
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={quote.author_profile.avatar_image?.url} 
                            alt={quote.author_profile.avatar_image?.alt_text || quote.author_profile.name}
                          />
                          <AvatarFallback style={{ backgroundColor: generateAvatarColor(quote.author_profile.name) }}>
                            {generateInitials(quote.author_profile.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card
            style={{
              borderColor: "hsl(var(--scheme-card-border))",
              backgroundColor: "hsl(var(--scheme-card-bg))",
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
    </CollectionLayout>
  );
}

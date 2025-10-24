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
import { QuoteSubmissionDialog } from "@/components/QuoteSubmissionDialog";
import { Plus } from "lucide-react";

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
        .select("*")
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
      primaryColor={collection.primary_color}
      secondaryColor={collection.secondary_color}
      webPrimary={collection.web_primary}
      webSecondary={collection.web_secondary}
      menuTextColor={collection.menu_text_color}
      menuHoverColor={collection.menu_hover_color}
      menuActiveColor={collection.menu_active_color}
      collectionBgColor={collection.collection_bg_color}
      collectionTextColor={collection.collection_text_color}
      collectionHeadingColor={collection.collection_heading_color}
      collectionAccentColor={collection.collection_accent_color}
      collectionCardBg={collection.collection_card_bg}
      collectionBorderColor={collection.collection_border_color}
      collectionMutedText={collection.collection_muted_text}
      collectionBadgeColor={collection.collection_badge_color}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quotes</h1>
            <p className="text-lg text-muted-foreground">
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
          <label className="text-sm font-medium">Filter by:</label>
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
                style={{ borderColor: collection.primary_color || undefined }}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <p className="text-lg italic mb-3">"{quote.quote}"</p>
                  {quote.author && (
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: collection.primary_color || undefined }}
                    >
                      — {quote.author}
                    </p>
                  )}
                  {quote.context && (
                    <p className="text-xs text-muted-foreground">{quote.context}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">
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

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PublicElectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: election, isLoading } = useQuery({
    queryKey: ["public-election", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_elections")
        .select(`
          *,
          collections(title),
          election_tags(tags(name))
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .eq("visibility", "public")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: results } = useQuery({
    queryKey: ["election-results", election?.id],
    queryFn: async () => {
      if (!election?.id) return [];
      const { data, error } = await supabase
        .from("election_results")
        .select(`
          *,
          profiles:winner_profile_id(display_name, avatar_image_id, slug),
          media_assets:media_ids(url, filename)
        `)
        .eq("election_id", election.id)
        .order("category");

      if (error) throw error;
      return data;
    },
    enabled: !!election?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Mock election not found</p>
        <Button onClick={() => navigate("/public/elections")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Elections
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/public/elections")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Elections
        </Button>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Trophy className="h-12 w-12 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <h1 className="text-4xl font-bold">{election.title}</h1>
              {election.description && (
                <p className="text-lg text-muted-foreground">
                  {election.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {election.collections && (
                  <Badge variant="secondary" className="text-sm">
                    {election.collections.title}
                  </Badge>
                )}
                {election.election_tags?.map((et: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {et.tags.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Results
          </h2>

          {!results || results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No results available yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {results.map((result: any) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-lg">
                      {result.superlative_category}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {result.category}
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Winner Info */}
                    <div className="flex items-center gap-4">
                      {result.profiles?.avatar_image_id ? (
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-uploads/${result.profiles.avatar_image_id}`}
                          />
                          <AvatarFallback>
                            {(result.profiles.display_name || result.winner_name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                          {(result.profiles?.display_name || result.winner_name || "?")[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        {result.profiles ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-xl font-semibold"
                            onClick={() => navigate(`/public/profiles/${result.profiles.slug}`)}
                          >
                            {result.profiles.display_name}
                          </Button>
                        ) : (
                          <p className="text-xl font-semibold">
                            {result.winner_name}
                          </p>
                        )}
                        {(result.vote_count || result.percentage) && (
                          <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                            {result.vote_count && (
                              <span>{result.vote_count} votes</span>
                            )}
                            {result.percentage && (
                              <span>{result.percentage}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {result.notes && (
                      <p className="text-sm text-muted-foreground border-t pt-4">
                        {result.notes}
                      </p>
                    )}

                    {/* Images */}
                    {result.media_assets && result.media_assets.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 border-t pt-4">
                        {result.media_assets.slice(0, 2).map((media: any, idx: number) => (
                          <img
                            key={idx}
                            src={media.url}
                            alt={media.filename}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

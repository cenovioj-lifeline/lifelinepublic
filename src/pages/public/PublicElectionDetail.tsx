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
      
      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from("election_results")
        .select("*")
        .eq("election_id", election.id)
        .order("category");

      if (resultsError) throw resultsError;
      if (!resultsData) return [];

      // Fetch related profiles and their avatars
      const profileIds = resultsData
        .filter(r => r.winner_profile_id)
        .map(r => r.winner_profile_id);

      let profilesMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, slug, avatar_image_id")
          .in("id", profileIds);

        if (profilesData) {
          // Fetch avatar images
          const avatarIds = profilesData
            .filter(p => p.avatar_image_id)
            .map(p => p.avatar_image_id);

          let avatarsMap: Record<string, any> = {};
          if (avatarIds.length > 0) {
            const { data: avatarsData } = await supabase
              .from("media_assets")
              .select("id, url")
              .in("id", avatarIds);

            if (avatarsData) {
              avatarsMap = avatarsData.reduce((acc, avatar) => {
                acc[avatar.id] = avatar;
                return acc;
              }, {} as Record<string, any>);
            }
          }

          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = {
              ...profile,
              avatar: profile.avatar_image_id ? avatarsMap[profile.avatar_image_id] : null
            };
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine results with profile data
      return resultsData.map(result => ({
        ...result,
        profile: result.winner_profile_id ? profilesMap[result.winner_profile_id] : null
      }));
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
            <div className="space-y-4">
              {results.map((result: any, index: number) => (
                <Card 
                  key={result.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                          ${index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                            index === 1 ? 'bg-gray-400 text-gray-950' : 
                            index === 2 ? 'bg-orange-600 text-orange-950' : 
                            'bg-muted text-muted-foreground'}
                        `}>
                          {index + 1}
                        </div>
                      </div>

                      {/* Winner Avatar & Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {result.profile?.avatar?.url ? (
                          <Avatar className="h-20 w-20 border-2 border-border flex-shrink-0">
                            <AvatarImage src={result.profile.avatar.url} />
                            <AvatarFallback className="text-2xl">
                              {(result.profile.display_name || result.winner_name || "?")[0]}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-2 border-border flex-shrink-0">
                            {(result.profile?.display_name || result.winner_name || "?")[0]}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Category */}
                          <p className="text-sm font-medium text-primary">
                            {result.category}
                          </p>
                          
                          {/* Winner Name */}
                          {result.profile ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-2xl font-bold hover:underline"
                              onClick={() => navigate(`/public/profiles/${result.profile.slug}`)}
                            >
                              {result.profile.display_name}
                            </Button>
                          ) : (
                            <h3 className="text-2xl font-bold">
                              {result.winner_name}
                            </h3>
                          )}
                          
                          {/* Superlative */}
                          {result.superlative_category && (
                            <p className="text-sm text-muted-foreground italic">
                              "{result.superlative_category}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      {(result.vote_count || result.percentage) && (
                        <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
                          {result.percentage && (
                            <div className="text-3xl font-bold text-primary">
                              {result.percentage}%
                            </div>
                          )}
                          {result.vote_count && (
                            <div className="text-sm text-muted-foreground">
                              {result.vote_count.toLocaleString()} votes
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {result.notes && (
                      <p className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                        {result.notes}
                      </p>
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

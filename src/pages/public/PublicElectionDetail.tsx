import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Award, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

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

  // Group results by category
  const groupedResults = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc: Record<string, any[]>, result: any) => {
      const category = result.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {});
  }, [results]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Trophy className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-base text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <Trophy className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-base text-muted-foreground text-center">Mock election not found</p>
        <Button onClick={() => navigate("/public/elections")} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Elections
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/public/elections")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                {election.title}
              </h1>
              {election.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  {election.description}
                </p>
              )}
            </div>
          </div>
          {(election.collections || election.election_tags?.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {election.collections && (
                <Badge variant="secondary" className="text-xs">
                  {election.collections.title}
                </Badge>
              )}
              {election.election_tags?.slice(0, 2).map((et: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {et.tags.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {!results || results.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No results available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedResults).map(([category, categoryResults]: [string, any]) => (
              <div key={category} className="space-y-3">
                {/* Category Header */}
                <div className="sticky top-[120px] sm:top-[110px] z-[5] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-2 -mx-4 px-4 border-y">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-base sm:text-lg font-bold text-primary">
                      {category}
                    </h2>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {categoryResults.length}
                    </Badge>
                  </div>
                </div>

                {/* Results in Category */}
                <div className="space-y-3">
                  {categoryResults.map((result: any) => (
                    <Card 
                      key={result.id} 
                      className="overflow-hidden hover:shadow-md transition-all animate-fade-in"
                    >
                      <CardContent className="p-4">
                        {/* Mobile-optimized layout */}
                        <div className="space-y-3">
                          {/* Top row: Avatar and Name */}
                          <div className="flex items-center gap-3">
                            {result.profile?.avatar?.url ? (
                              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 flex-shrink-0">
                                <AvatarImage src={result.profile.avatar.url} />
                                <AvatarFallback className="text-lg sm:text-xl font-bold">
                                  {(result.profile.display_name || result.winner_name || "?")[0]}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary border-2 border-primary/20 flex-shrink-0">
                                {(result.profile?.display_name || result.winner_name || "?")[0]}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              {result.profile ? (
                                <button
                                  onClick={() => navigate(`/public/profiles/${result.profile.slug}`)}
                                  className="text-left hover:underline"
                                >
                                  <h3 className="text-lg sm:text-xl font-bold truncate">
                                    {result.profile.display_name}
                                  </h3>
                                </button>
                              ) : (
                                <h3 className="text-lg sm:text-xl font-bold truncate">
                                  {result.winner_name}
                                </h3>
                              )}
                              
                              {result.superlative_category && (
                                <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-2">
                                  "{result.superlative_category}"
                                </p>
                              )}
                            </div>

                            {/* Trophy Icon for top 3 */}
                            {categoryResults.indexOf(result) < 3 && (
                              <div className={`
                                flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold
                                ${categoryResults.indexOf(result) === 0 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 
                                  categoryResults.indexOf(result) === 1 ? 'bg-gray-400/20 text-gray-700 dark:text-gray-400' : 
                                  'bg-orange-600/20 text-orange-700 dark:text-orange-400'}
                              `}>
                                {categoryResults.indexOf(result) === 0 ? '🥇' : 
                                 categoryResults.indexOf(result) === 1 ? '🥈' : '🥉'}
                              </div>
                            )}
                          </div>

                          {/* Stats row (if available) */}
                          {(result.vote_count || result.percentage) && (
                            <div className="flex items-center gap-4 text-sm bg-muted/50 rounded-lg p-2">
                              {result.percentage && (
                                <div className="flex items-center gap-1">
                                  <span className="text-lg sm:text-xl font-bold text-primary">
                                    {result.percentage}%
                                  </span>
                                </div>
                              )}
                              {result.vote_count && (
                                <div className="text-muted-foreground">
                                  {result.vote_count.toLocaleString()} votes
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {result.notes && (
                            <p className="text-xs sm:text-sm text-muted-foreground border-t pt-3">
                              {result.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

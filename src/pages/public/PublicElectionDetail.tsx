import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Award, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { FavoriteButton } from "@/components/FavoriteButton";

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
      
      const { data: resultsData, error: resultsError } = await supabase
        .from("election_results")
        .select("*")
        .eq("election_id", election.id);

      if (resultsError) throw resultsError;
      if (!resultsData) return [];

      const profileIds = resultsData
        .filter(r => r.winner_profile_ids && r.winner_profile_ids.length > 0)
        .flatMap(r => r.winner_profile_ids);

      let profilesMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, slug, avatar_image_id")
          .in("id", profileIds);

        if (profilesData) {
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

      return resultsData.map(result => ({
        ...result,
        profiles: result.winner_profile_ids?.map(id => profilesMap[id]).filter(Boolean) || []
      }));
    },
    enabled: !!election?.id,
  });

  const { data: categoryOrdering } = useQuery({
    queryKey: ["election-category-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_category_order")
        .select("*");
      
      if (error) throw error;
      
      const orderMap: Record<string, number> = {};
      data?.forEach(o => {
        orderMap[o.category] = o.display_order;
      });
      return orderMap;
    },
  });

  const groupedResults = useMemo(() => {
    if (!results) return {};
    
    const grouped = results.reduce((acc: Record<string, any[]>, result: any) => {
      const category = result.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {});
    
    const sortedEntries = Object.entries(grouped).sort(([catA], [catB]) => {
      const orderA = categoryOrdering?.[catA] ?? -1;
      const orderB = categoryOrdering?.[catB] ?? -1;
      
      if (orderA === -1 && orderB === -1) {
        return catA.localeCompare(catB);
      }
      
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      
      return orderB - orderA;
    });
    
    return Object.fromEntries(sortedEntries);
  }, [results, categoryOrdering]);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(groupedResults).forEach(cat => initial[cat] = true);
    return initial;
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <Trophy className="h-12 w-12 text-primary mx-auto animate-pulse" />
            <p className="text-base text-muted-foreground">Loading results...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!election) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
          <Trophy className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-base text-muted-foreground text-center">Mock election not found</p>
          <Button onClick={() => navigate("/public/elections")} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Elections
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/public/elections")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <FavoriteButton itemId={election.id} itemType="election" />
            </div>
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
            {election.election_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {election.election_tags.slice(0, 2).map((et: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {et.tags.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-6">
          {!results || results.length === 0 ? (
            <Card className="mt-8">
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No results available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([category, categoryResults]: [string, any]) => (
                <Collapsible
                  key={category}
                  open={openCategories[category] ?? true}
                  onOpenChange={(open) => setOpenCategories(prev => ({ ...prev, [category]: open }))}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                          <h2 className="text-lg sm:text-xl font-bold text-primary text-left">
                            {category}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {categoryResults.length}
                          </Badge>
                          <ChevronDown className={`h-5 w-5 transition-transform ${openCategories[category] ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="space-y-3 p-4 pt-0">
                        {categoryResults.map((result: any) => (
                          <Card 
                            key={result.id} 
                            className="overflow-hidden hover:shadow-md transition-all animate-fade-in"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {result.profiles && result.profiles.length > 0 && result.profiles[0]?.avatar?.url ? (
                                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 flex-shrink-0">
                                    <AvatarImage src={result.profiles[0].avatar.url} />
                                    <AvatarFallback className="text-lg sm:text-xl font-bold">
                                      {(result.profiles[0].display_name || result.winner_name || "?")[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary border-2 border-primary/20 flex-shrink-0">
                                    {(result.profiles?.[0]?.display_name || result.winner_name || "?")[0]}
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0 space-y-2">
                                  {result.superlative_category && (
                                    <h3 className="text-lg sm:text-xl font-bold line-clamp-2">
                                      {result.superlative_category}
                                    </h3>
                                  )}
                                  
                                  {result.profiles && result.profiles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {result.profiles.map((profile: any, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={() => navigate(`/public/profiles/${profile.slug}`)}
                                          className="text-sm sm:text-base text-muted-foreground hover:text-primary hover:underline transition-colors text-left"
                                        >
                                          {profile.display_name}{idx < result.profiles.length - 1 ? ',' : ''}
                                        </button>
                                      ))}
                                    </div>
                                  ) : result.winner_name ? (
                                    <p className="text-sm sm:text-base text-muted-foreground">
                                      {result.winner_name}
                                    </p>
                                  ) : null}

                                  {(result.vote_count || result.percentage) && (
                                    <div className="flex items-center gap-4 text-sm bg-muted/50 rounded-lg p-2">
                                      {result.percentage && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-base sm:text-lg font-bold text-primary">
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

                                  {result.notes && (
                                    <p className="text-xs sm:text-sm text-muted-foreground border-t pt-2">
                                      {result.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

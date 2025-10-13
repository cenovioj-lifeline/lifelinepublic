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
import { CollectionLayout } from "@/components/CollectionLayout";

export default function CollectionElectionDetail() {
  const { collectionSlug, electionSlug } = useParams<{ collectionSlug: string; electionSlug: string }>();
  const navigate = useNavigate();

  const { data: election, isLoading } = useQuery({
    queryKey: ["collection-election", collectionSlug, electionSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_elections")
        .select(`
          *,
          collections(
            id,
            title,
            slug,
            primary_color,
            secondary_color,
            web_primary,
            web_secondary,
            menu_text_color,
            menu_hover_color,
            menu_active_color,
            collection_bg_color,
            collection_text_color,
            collection_heading_color,
            collection_accent_color,
            collection_card_bg,
            collection_border_color,
            collection_muted_text,
            collection_badge_color
          ),
          election_tags(tags(name))
        `)
        .eq("slug", electionSlug)
        .eq("status", "published")
        .eq("visibility", "public")
        .single();

      if (error) throw error;
      
      // Verify this election belongs to the collection
      if (data.collections?.slug !== collectionSlug) {
        throw new Error("Election not found in this collection");
      }
      
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
        <Button onClick={() => navigate(`/public/collections/${collectionSlug}/elections`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Elections
        </Button>
      </div>
    );
  }

  const collection = election.collections as any;
  
  const getDarkestColor = () => {
    if (!collection) return '#000000';
    
    const colors = [
      collection.primary_color,
      collection.secondary_color,
      collection.web_primary,
      collection.web_secondary,
      collection.menu_text_color,
      collection.menu_hover_color,
      collection.menu_active_color
    ].filter(Boolean);
    
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    
    let darkest = '#000000';
    let minLuminance = 255;
    
    colors.forEach(color => {
      const luminance = getLuminance(color);
      if (luminance < minLuminance) {
        minLuminance = luminance;
        darkest = color;
      }
    });
    
    return darkest;
  };
  
  const darkestColor = getDarkestColor();
  const badgeColor = collection?.web_primary || collection?.primary_color;
  const accentColor = collection?.menu_hover_color || collection?.secondary_color;
  const borderColor = collection?.menu_active_color || collection?.primary_color;

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
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 flex-shrink-0" style={{ color: accentColor }} />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: darkestColor }}>
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
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${badgeColor}20`,
                      color: badgeColor,
                      borderColor: badgeColor
                    }}
                  >
                    {election.collections.title}
                  </Badge>
                )}
                {election.election_tags?.slice(0, 2).map((et: any, idx: number) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: accentColor,
                      color: accentColor
                    }}
                  >
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
                          <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: accentColor }} />
                          <h2 className="text-lg sm:text-xl font-bold text-left" style={{ color: darkestColor }}>
                            {category}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${badgeColor}20`,
                              color: badgeColor
                            }}
                          >
                            {categoryResults.length}
                          </Badge>
                          <ChevronDown 
                            className={`h-5 w-5 transition-transform ${openCategories[category] ? 'rotate-180' : ''}`}
                            style={{ color: accentColor }}
                          />
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
                                  <Avatar 
                                    className="h-14 w-14 sm:h-16 sm:w-16 border-2 flex-shrink-0"
                                    style={{ borderColor: `${borderColor}40` }}
                                  >
                                    <AvatarImage src={result.profiles[0].avatar.url} />
                                    <AvatarFallback 
                                      className="text-lg sm:text-xl font-bold"
                                      style={{ 
                                        backgroundColor: `${accentColor}20`,
                                        color: accentColor
                                      }}
                                    >
                                      {(result.profiles[0].display_name || result.winner_name || "?")[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div 
                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold border-2 flex-shrink-0"
                                    style={{ 
                                      backgroundColor: `${accentColor}20`,
                                      color: accentColor,
                                      borderColor: `${borderColor}40`
                                    }}
                                  >
                                    {(result.profiles?.[0]?.display_name || result.winner_name || "?")[0]}
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0 space-y-2">
                                  {result.superlative_category && (
                                    <h3 className="text-lg sm:text-xl font-bold line-clamp-2" style={{ color: darkestColor }}>
                                      {result.superlative_category}
                                    </h3>
                                  )}
                                  
                                  {result.profiles && result.profiles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {result.profiles.map((profile: any, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={() => navigate(`/public/collections/${collectionSlug}/profiles/${profile.slug}`)}
                                          className="text-sm sm:text-base text-muted-foreground hover:underline transition-colors text-left"
                                          style={{ 
                                            ['--hover-color' as any]: accentColor 
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
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
                                          <span className="text-base sm:text-lg font-bold" style={{ color: accentColor }}>
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
    </CollectionLayout>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, TrendingUp, Star } from "lucide-react";
import { useState } from "react";

export default function PublicProfileDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          avatar:avatar_image_id(url),
          profile_lifelines(
            lifeline:lifelines(
              id,
              slug,
              title,
              subtitle,
              cover_image_id,
              cover:cover_image_id(url)
            )
          ),
          profile_collections(
            collection:collections(
              id,
              slug,
              title,
              description,
              hero_image_id,
              hero:hero_image_id(url)
            )
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Query for lifeline count and stats
  const { data: stats } = useQuery({
    queryKey: ["profile-stats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { count } = await supabase
        .from("profile_lifelines")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile.id);

      return {
        lifelinesCount: count || 0,
        votesCount: Math.floor(Math.random() * 500000), // Placeholder
        rating: (4 + Math.random()).toFixed(1), // Placeholder
      };
    },
    enabled: !!profile?.id,
  });

  const handleFollowClick = () => {
    if (!user) {
      // This will trigger the auth modal
      return;
    }
    setIsFollowing(!isFollowing);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="flex flex-col items-center space-y-4">
          <div className="h-32 w-32 rounded-full bg-muted" />
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
        <Button onClick={() => navigate("/public/profiles")} className="mt-4">
          Back to Profiles
        </Button>
      </div>
    );
  }

  const lifelines = profile.profile_lifelines?.map((pl: any) => pl.lifeline).filter(Boolean) || [];
  const collections = profile.profile_collections?.map((pc: any) => pc.collection).filter(Boolean) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/public/profiles")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Profiles
      </Button>

      {/* Profile Header - Mobile First Design */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage
                src={(profile.avatar as any)?.url}
                alt={profile.display_name}
              />
              <AvatarFallback className="text-3xl">
                {profile.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {profile.display_name}
              </h1>
              {profile.occupation && (
                <p className="text-muted-foreground mt-1">
                  {profile.occupation}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">{stats?.lifelinesCount || 0}</span>
                <span className="text-muted-foreground">Lifelines</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-destructive" />
                <span className="font-semibold">{stats?.votesCount.toLocaleString() || "0"}</span>
                <span className="text-muted-foreground">Votes</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{stats?.rating || "0.0"}</span>
                <span className="text-muted-foreground">Rating</span>
              </div>
            </div>

            {/* Follow Button */}
            <Button
              size="lg"
              onClick={handleFollowClick}
              variant={isFollowing ? "outline" : "default"}
              className="w-full max-w-xs"
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>

            {/* Bio/Summary */}
            {(profile.summary || profile.long_bio) && (
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                {profile.summary || profile.long_bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Lifeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-8 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Timeline Graph Preview</p>
              <p className="text-xs mt-1">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Lifelines */}
      {lifelines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Lifelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex gap-4 pb-2">
                {lifelines.map((lifeline: any) => (
                  <Card
                    key={lifeline.id}
                    className="flex-shrink-0 w-64 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/public/lifelines`)}
                  >
                    {lifeline.cover?.url && (
                      <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                        <img
                          src={lifeline.cover.url}
                          alt={lifeline.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="p-4">
                      <CardTitle className="text-base line-clamp-1">
                        {lifeline.title}
                      </CardTitle>
                      {lifeline.subtitle && (
                        <CardDescription className="text-xs line-clamp-2">
                          {lifeline.subtitle}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Collections */}
      {collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {collections.map((collection: any) => (
                <Card
                  key={collection.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/public/collections`)}
                >
                  {collection.hero?.url && (
                    <div className="aspect-square bg-muted overflow-hidden rounded-t-lg">
                      <img
                        src={collection.hero.url}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm line-clamp-2">
                      {collection.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

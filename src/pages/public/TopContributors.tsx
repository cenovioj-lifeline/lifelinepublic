import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CollectionLayout } from "@/components/CollectionLayout";

export default function TopContributors() {
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();
  const [selectedContributor, setSelectedContributor] = useState<any>(null);

  // Check if we're in a collection context
  const isCollectionContext = location.pathname.includes("/collections/");

  const { data: collection } = useQuery({
    queryKey: ["collection-for-contributors", slug],
    queryFn: async () => {
      if (!slug || !isCollectionContext) return null;
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isCollectionContext && !!slug,
  });

  const { data: contributors, isLoading } = useQuery({
    queryKey: ["top-contributors", collection?.id],
    queryFn: async () => {
      // First, get lifelines for this collection if in collection context
      let lifelineIds: string[] | undefined;
      if (collection?.id) {
        const { data: lifelines } = await supabase
          .from("lifelines")
          .select("id")
          .eq("collection_id", collection.id);
        lifelineIds = lifelines?.map((l) => l.id) || [];
      }

      // Fetch fan contributions, filtered by lifeline if needed
      let query = supabase
        .from("fan_contributions")
        .select("user_id, lifeline_id")
        .eq("status", "approved");

      if (lifelineIds && lifelineIds.length > 0) {
        query = query.in("lifeline_id", lifelineIds);
      }

      const { data: contributions, error: contribError } = await query;

      if (contribError) throw contribError;

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, avatar_url");

      if (profilesError) throw profilesError;

      // Create a profile lookup map
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Group by user and count
      const userCounts = contributions.reduce((acc: any, curr) => {
        if (!acc[curr.user_id]) {
          acc[curr.user_id] = {
            user_id: curr.user_id,
            count: 0,
            profile: profileMap.get(curr.user_id),
          };
        }
        acc[curr.user_id].count++;
        return acc;
      }, {});

      return Object.values(userCounts).sort(
        (a: any, b: any) => b.count - a.count
      );
    },
    enabled: !isCollectionContext || !!collection,
  });

  const { data: selectedContributions } = useQuery({
    queryKey: ["contributor-details", selectedContributor?.user_id, collection?.id],
    queryFn: async () => {
      if (!selectedContributor?.user_id) return [];

      // Get lifelines for collection if needed
      let lifelineIds: string[] | undefined;
      if (collection?.id) {
        const { data: lifelines } = await supabase
          .from("lifelines")
          .select("id")
          .eq("collection_id", collection.id);
        lifelineIds = lifelines?.map((l) => l.id) || [];
      }

      let query = supabase
        .from("fan_contributions")
        .select(`
          *,
          lifelines(title, slug, collection_id)
        `)
        .eq("user_id", selectedContributor.user_id)
        .eq("status", "approved");

      if (lifelineIds && lifelineIds.length > 0) {
        query = query.in("lifeline_id", lifelineIds);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedContributor?.user_id,
  });

  const getDisplayName = (profile: any) => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
    }
    return "Anonymous Fan";
  };

  const getInitials = (profile: any) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return "F";
  };

  const content = (
    <>
      <h1 className="text-4xl font-bold mb-8">Top Contributors</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {isCollectionContext
          ? `Celebrating community members who contribute to ${collection?.title || "this collection"}`
          : "Celebrating our community members who help make our lifelines better"}
      </p>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {contributors?.map((contributor: any, index: number) => (
            <Card
              key={contributor.user_id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedContributor(contributor)}
              style={
                collection
                  ? { borderColor: collection.primary_color || undefined }
                  : undefined
              }
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="text-3xl font-bold text-muted-foreground w-12">
                  #{index + 1}
                </div>
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={contributor.profile?.avatar_url}
                    alt={getDisplayName(contributor.profile)}
                  />
                  <AvatarFallback>
                    {getInitials(contributor.profile)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {getDisplayName(contributor.profile)}
                  </h3>
                  <p className="text-muted-foreground">
                    {contributor.count} approved contribution
                    {contributor.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-lg px-4 py-2"
                  style={
                    collection
                      ? {
                          backgroundColor: collection.collection_badge_color || undefined,
                          color: collection.collection_text_color || undefined,
                        }
                      : undefined
                  }
                >
                  {contributor.count}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedContributor}
        onOpenChange={() => setSelectedContributor(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {getDisplayName(selectedContributor?.profile)}'s Contributions
            </DialogTitle>
            <DialogDescription>
              {isCollectionContext
                ? `Approved contributions to ${collection?.title || "this collection"}`
                : "All approved contributions from this user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedContributions?.map((contribution) => (
              <Card key={contribution.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {contribution.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {contribution.lifelines?.title}
                    {contribution.score && ` • Score: ${contribution.score}`}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{contribution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isCollectionContext && collection) {
    return (
        <CollectionLayout
          collectionTitle={collection.title}
          collectionSlug={collection.slug}
          collectionId={collection.id}
        >
        <div className="container mx-auto px-4 py-8">{content}</div>
      </CollectionLayout>
    );
  }

  return <div className="container mx-auto px-4 py-8">{content}</div>;
}

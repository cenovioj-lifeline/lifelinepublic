import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type CollectionFeaturedProfilesProps = {
  collectionId: string;
};

export function CollectionFeaturedProfiles({ collectionId }: CollectionFeaturedProfilesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileConnections, isLoading } = useQuery({
    queryKey: ["collection-profile-connections", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_collections")
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            slug,
            avatar_image:media_assets!profiles_avatar_image_id_fkey(url)
          )
        `)
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ connectionId, isFeatured }: { connectionId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("profile_collections")
        .update({ is_featured: isFeatured })
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-profile-connections", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collection-profiles"] });
      toast({
        title: "Success",
        description: "Featured status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!profileConnections || profileConnections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No profiles are linked to this collection yet. Link profiles to this collection from the Profile edit page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Profiles</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select which profiles should appear in the featured section of the collection homepage
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {profileConnections.map((connection) => {
          const profile = connection.profiles as any;
          return (
            <div
              key={connection.id}
              className="flex items-center space-x-4 rounded-lg border p-4"
            >
              <Checkbox
                checked={connection.is_featured}
                onCheckedChange={(checked) => {
                  toggleFeaturedMutation.mutate({
                    connectionId: connection.id,
                    isFeatured: !!checked,
                  });
                }}
              />
              {profile.avatar_image?.url && (
                <img
                  src={profile.avatar_image.url}
                  alt={profile.display_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{profile.display_name}</p>
                  {connection.is_featured && (
                    <Badge variant="secondary" className="text-xs">Featured</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile.slug}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

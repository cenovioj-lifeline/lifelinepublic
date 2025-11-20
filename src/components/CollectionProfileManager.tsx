import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type CollectionProfileManagerProps = {
  collectionId: string;
};

export function CollectionProfileManager({ collectionId }: CollectionProfileManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all profiles
  const { data: allProfiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          slug,
          status,
          avatar_image:media_assets!profiles_avatar_image_id_fkey(url)
        `)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch current profile connections
  const { data: currentConnections, isLoading: loadingConnections } = useQuery({
    queryKey: ["collection-profile-connections", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_collections")
        .select("profile_id")
        .eq("collection_id", collectionId);

      if (error) throw error;
      return new Set(data.map(conn => conn.profile_id));
    },
  });

  // Initialize selected profiles when data loads
  useEffect(() => {
    if (currentConnections && selectedProfiles.size === 0) {
      setSelectedProfiles(new Set(currentConnections));
    }
  }, [currentConnections]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const toAdd = Array.from(selectedProfiles).filter(
        id => !currentConnections?.has(id)
      );
      const toRemove = Array.from(currentConnections || []).filter(
        id => !selectedProfiles.has(id)
      );

      // Add new connections
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("profile_collections")
          .insert(
            toAdd.map(profileId => ({
              collection_id: collectionId,
              profile_id: profileId,
            }))
          );

        if (insertError) throw insertError;
      }

      // Remove connections
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("profile_collections")
          .delete()
          .eq("collection_id", collectionId)
          .in("profile_id", toRemove);

        if (deleteError) throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-profile-connections", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collection-profiles"] });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Profile connections updated",
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

  const toggleProfile = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
    setHasChanges(true);
  };

  const selectAll = () => {
    if (allProfiles) {
      setSelectedProfiles(new Set(allProfiles.map(p => p.id)));
      setHasChanges(true);
    }
  };

  const selectNone = () => {
    setSelectedProfiles(new Set());
    setHasChanges(true);
  };

  if (loadingProfiles || loadingConnections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Profile Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!allProfiles || allProfiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Profile Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No profiles available. Create profiles first to link them to this collection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Profile Connections</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select which profiles belong to this collection
        </p>
        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectNone}
          >
            Select None
          </Button>
          {hasChanges && (
            <Button
              type="button"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {allProfiles.map((profile) => {
          const avatarImage = profile.avatar_image as any;
          return (
            <div
              key={profile.id}
              className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={selectedProfiles.has(profile.id)}
                onCheckedChange={() => toggleProfile(profile.id)}
              />
              <Avatar className="h-10 w-10">
                {avatarImage?.url && (
                  <AvatarImage src={avatarImage.url} alt={profile.name} />
                )}
                <AvatarFallback>
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.slug}</p>
              </div>
              <Badge variant={profile.status === "published" ? "default" : "secondary"}>
                {profile.status}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

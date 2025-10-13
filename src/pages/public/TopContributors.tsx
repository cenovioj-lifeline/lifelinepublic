import { useQuery } from "@tanstack/react-query";
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

export default function TopContributors() {
  const [selectedContributor, setSelectedContributor] = useState<any>(null);

  const { data: contributors, isLoading } = useQuery({
    queryKey: ["top-contributors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_contributions")
        .select(`
          user_id,
          user_profiles(first_name, last_name, avatar_url)
        `)
        .eq("status", "approved");

      if (error) throw error;

      // Group by user and count
      const userCounts = data.reduce((acc: any, curr) => {
        if (!acc[curr.user_id]) {
          acc[curr.user_id] = {
            user_id: curr.user_id,
            count: 0,
            profile: curr.user_profiles,
          };
        }
        acc[curr.user_id].count++;
        return acc;
      }, {});

      return Object.values(userCounts).sort(
        (a: any, b: any) => b.count - a.count
      );
    },
  });

  const { data: selectedContributions } = useQuery({
    queryKey: ["contributor-details", selectedContributor?.user_id],
    queryFn: async () => {
      if (!selectedContributor?.user_id) return [];
      const { data, error } = await supabase
        .from("fan_contributions")
        .select(`
          *,
          lifelines(title, slug)
        `)
        .eq("user_id", selectedContributor.user_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Top Contributors</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Celebrating our community members who help make our lifelines better
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
                <Badge variant="secondary" className="text-lg px-4 py-2">
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
              All approved contributions from this user
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
    </div>
  );
}

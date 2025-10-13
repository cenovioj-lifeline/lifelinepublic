import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function TopContributorsCard() {
  const { data: topContributors, isLoading } = useQuery({
    queryKey: ["top-contributors-preview"],
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

      return Object.values(userCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);
    },
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

  if (isLoading || !topContributors || topContributors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Contributors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topContributors.map((contributor: any) => (
          <div key={contributor.user_id} className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={contributor.profile?.avatar_url}
                alt={getDisplayName(contributor.profile)}
              />
              <AvatarFallback>{getInitials(contributor.profile)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{getDisplayName(contributor.profile)}</p>
              <p className="text-sm text-muted-foreground">
                {contributor.count} contribution{contributor.count !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge variant="secondary">{contributor.count}</Badge>
          </div>
        ))}
        <Link
          to="/top-contributors"
          className="flex items-center gap-2 text-sm text-primary hover:underline pt-2"
        >
          View all contributors
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

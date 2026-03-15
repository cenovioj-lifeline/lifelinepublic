import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInitials } from "@/lib/avatarUtils";

interface MemberWithProfile {
  id: string;
  user_id: string;
  joined_at: string;
  hidden_from_list: boolean;
  member_number: number;
  user_profile: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function CollectionMembers() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  // Fetch collection details
  const { data: collection, isLoading: isLoadingCollection } = useQuery({
    queryKey: ["collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug, color_scheme_id")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Apply color scheme - pass collection ID, not color_scheme_id
  useColorScheme(collection?.id || null);

  // Fetch members with their profiles and calculated member numbers
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["collection-members-list", collection?.id, user?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      // Fetch all members for this collection ordered by joined_at
      const { data: memberData, error: memberError } = await supabase
        .from("collection_members")
        .select("id, user_id, joined_at, hidden_from_list")
        .eq("collection_id", collection.id)
        .order("joined_at", { ascending: true });

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return [];

      // Get user IDs for profile lookup
      const userIds = memberData.map((m) => m.user_id);

      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Create a map for quick profile lookup
      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p]) || []
      );

      // Calculate member numbers and attach profiles
      // Only include visible members (not hidden), unless it's the current user
      const membersWithNumbers: MemberWithProfile[] = [];
      let memberNumber = 0;

      for (const member of memberData) {
        // If hidden and not the current user, skip for display but don't increment number
        const isHidden = member.hidden_from_list;
        const isCurrentUser = member.user_id === user?.id;

        // Always count for member number (hidden members still get numbers)
        memberNumber++;

        // Only include in display list if not hidden OR is the current user
        if (!isHidden || isCurrentUser) {
          membersWithNumbers.push({
            ...member,
            member_number: memberNumber,
            user_profile: profileMap.get(member.user_id) || null,
          });
        }
      }

      return membersWithNumbers;
    },
    enabled: !!collection?.id,
  });

  // Get total member count (including hidden)
  const { data: totalCount } = useQuery({
    queryKey: ["collection-member-count", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return 0;
      const { count, error } = await supabase
        .from("collection_members")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", collection.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!collection?.id,
  });

  if (isLoadingCollection) {
    return (
      <CollectionLayout collectionTitle="" collectionSlug={slug || ""}>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </CollectionLayout>
    );
  }

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="" collectionSlug={slug || ""}>
        <div className="p-6 text-center">
          <p>Collection not found</p>
        </div>
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout collectionTitle={collection.title} collectionSlug={collection.slug}>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/public/collections/${collection.slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "hsl(var(--scheme-title-text))" }}
            >
              <Users className="h-6 w-6" />
              Members
            </h1>
            <p 
              className="text-sm"
              style={{ color: "hsl(var(--scheme-cards-text))" }}
            >
              {totalCount} {totalCount === 1 ? "member" : "members"} of the {collection.title} community
            </p>
          </div>
        </div>

        {/* Members Grid */}
        {isLoadingMembers ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {members.map((member) => {
              const fullName = member.user_profile
                ? `${member.user_profile.first_name || ""} ${member.user_profile.last_name || ""}`.trim()
                : "Anonymous";
              const isCurrentUser = member.user_id === user?.id;

              return (
                <Card
                  key={member.id}
                  className="transition-colors"
                  style={{
                    borderColor: "hsl(var(--scheme-cards-border))",
                    backgroundColor: "hsl(var(--scheme-cards-bg))",
                  }}
                >
                  <CardContent className="flex items-center gap-4 pt-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.user_profile?.avatar_url || undefined} />
                      <AvatarFallback
                        style={{ backgroundColor: "hsl(var(--scheme-nav-bg))" }}
                      >
                        {generateInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-semibold truncate"
                        style={{ color: "hsl(var(--scheme-cards-text))" }}
                      >
                        {fullName || "Anonymous"}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal opacity-70">(You)</span>
                        )}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: "hsl(var(--scheme-cards-text))", opacity: 0.7 }}
                      >
                        Member #{member.member_number}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div 
            className="text-center py-12"
            style={{ color: "hsl(var(--scheme-cards-text))" }}
          >
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No members yet</p>
            <p className="text-sm opacity-70">Be the first to join this community!</p>
          </div>
        )}
      </div>
    </CollectionLayout>
  );
}

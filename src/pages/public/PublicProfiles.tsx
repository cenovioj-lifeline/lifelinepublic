import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

type ProfileType = "all" | "person_real" | "person_fictional" | "entity" | "organization";

export default function PublicProfiles() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProfileType>("all");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["public-profiles", searchTerm, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          slug,
          name,
          short_description,
          subject_type,
          reality_status,
          avatar_image_id,
          media_assets:avatar_image_id(url)
        `)
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
      }

      if (typeFilter !== "all") {
        query = query.eq("subject_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "person_real": return "Real Person";
      case "person_fictional": return "Fictional";
      case "entity": return "Entity";
      case "organization": return "Organization";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profiles</h1>
        <p className="text-muted-foreground">
          Explore real and fictional characters, entities, and organizations
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search profiles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Type Filter */}
      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProfileType)}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="person_real">Real</TabsTrigger>
          <TabsTrigger value="person_fictional">Fictional</TabsTrigger>
          <TabsTrigger value="entity">Entities</TabsTrigger>
          <TabsTrigger value="organization">Organizations</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Profile Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/public/profiles/${profile.slug}`)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={(profile.media_assets as any)?.url}
                      alt={profile.name}
                    />
                    <AvatarFallback className="text-lg">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1 truncate">
                      {profile.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {profile.subject_type} • {profile.reality_status}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {profile.short_description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.short_description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No profiles found. Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function PublicElections() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");

  const { data: elections, isLoading } = useQuery({
    queryKey: ["public-elections", searchTerm, selectedTagId],
    queryFn: async () => {
      let query = supabase
        .from("mock_elections")
        .select(`
          *,
          collections(title),
          election_tags(tag_id, tags(id, name))
        `)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (selectedTagId) {
        return data.filter(election => 
          election.election_tags?.some((et: any) => et.tag_id === selectedTagId)
        );
      }

      return data;
    },
  });

  const { data: availableTags } = useQuery({
    queryKey: ["election-tag-filters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_tags")
        .select("tags(id, name)")
        .order("tags(name)");
      
      if (error) throw error;

      const uniqueTags = new Map();
      data.forEach((item: any) => {
        if (item.tags) {
          uniqueTags.set(item.tags.id, item.tags);
        }
      });

      return Array.from(uniqueTags.values());
    },
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Award className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Mock Election Results</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse historical mock election results and superlative winners
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search mock elections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          {availableTags && availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedTagId === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTagId("")}
              >
                All
              </Button>
              {availableTags.map((tag: any) => (
                <Button
                  key={tag.id}
                  variant={selectedTagId === tag.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTagId(tag.id)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : elections?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No mock election results found
            </div>
          ) : (
            elections?.map((election: any) => (
              <div key={election.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton itemId={election.id} itemType="election" />
                </div>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/public/elections/${election.slug}`)}
                >
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold line-clamp-2">
                      {election.title}
                    </h3>
                    {election.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {election.description}
                      </p>
                    )}
                  </div>

                  {election.collections && (
                    <Badge variant="secondary">
                      {election.collections.title}
                    </Badge>
                  )}

                  {election.election_tags && election.election_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {election.election_tags.slice(0, 3).map((et: any) => (
                        <Badge key={et.tag_id} variant="outline" className="text-xs">
                          {et.tags.name}
                        </Badge>
                      ))}
                      {election.election_tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{election.election_tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(election.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

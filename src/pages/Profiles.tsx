import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Profiles() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, slug, title")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles", searchTerm, collectionFilter],
    queryFn: async () => {
      if (collectionFilter === "all") {
        // Show all profiles when no collection filter is applied
        let query = supabase
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false });

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      } else {
        // Filter by collection
        let query = supabase
          .from("profiles")
          .select(`
            *,
            profile_collections!inner(collection_id)
          `)
          .eq("profile_collections.collection_id", collectionFilter)
          .order("updated_at", { ascending: false });

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Remove duplicates if a profile is in multiple collections
        const uniqueProfiles = Array.from(
          new Map(data?.map(p => [p.id, p])).values()
        );
        
        return uniqueProfiles;
      }
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
        <p className="text-muted-foreground">
          Manage people, organizations, and topics
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections?.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : profiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No profiles found
                </TableCell>
              </TableRow>
            ) : (
              profiles?.map((profile) => (
                <TableRow
                  key={profile.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/profiles/${profile.id}`)}
                >
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{profile.subject_type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {profile.short_description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.status === "published" ? "default" : "secondary"}>
                      {profile.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profiles/${profile.id}`);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

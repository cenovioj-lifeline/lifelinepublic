import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTER_STORAGE_KEY = "lifelines-filters";

export default function Lifelines() {
  const navigate = useNavigate();
  
  // Load saved filters from localStorage
  const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
  const initialFilters = savedFilters ? JSON.parse(savedFilters) : {
    searchTerm: "",
    collectionFilter: "all",
    pictureFilter: "all",
    lifelineTypeFilter: "all"
  };

  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [collectionFilter, setCollectionFilter] = useState<string>(initialFilters.collectionFilter);
  const [pictureFilter, setPictureFilter] = useState<string>(initialFilters.pictureFilter);
  const [lifelineTypeFilter, setLifelineTypeFilter] = useState<string>(initialFilters.lifelineTypeFilter);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      searchTerm,
      collectionFilter,
      pictureFilter,
      lifelineTypeFilter
    }));
  }, [searchTerm, collectionFilter, pictureFilter, lifelineTypeFilter]);

  const { data: collections } = useQuery({
    queryKey: ["collections-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["lifelines", searchTerm, collectionFilter, pictureFilter, lifelineTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("lifelines")
        .select("*, profiles(display_name), collections(title), media_assets!lifelines_cover_image_id_fkey(url, position_x, position_y)")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
      }

      if (collectionFilter && collectionFilter !== "all") {
        query = query.eq("collection_id", collectionFilter);
      }

      if (pictureFilter === "with-pic") {
        query = query.not("cover_image_id", "is", null);
      } else if (pictureFilter === "without-pic") {
        query = query.is("cover_image_id", null);
      }

      if (lifelineTypeFilter && lifelineTypeFilter !== "all") {
        query = query.eq("lifeline_type", lifelineTypeFilter as "person" | "list" | "voting");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lifelines</h1>
          <p className="text-muted-foreground">
            Manage scored timeline narratives with entries
          </p>
        </div>
        <Button onClick={() => navigate("/lifelines/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Lifeline
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lifelines..."
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
        <Select value={lifelineTypeFilter} onValueChange={setLifelineTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="voting">Voting</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pictureFilter} onValueChange={setPictureFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Picture Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pictures</SelectItem>
            <SelectItem value="with-pic">With Picture</SelectItem>
            <SelectItem value="without-pic">Without Picture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Cover Image</TableHead>
              <TableHead>Lifeline Name</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lifelines?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No lifelines found
                </TableCell>
              </TableRow>
            ) : (
              lifelines?.map((lifeline) => (
                <TableRow
                  key={lifeline.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/lifelines/${lifeline.id}`)}
                >
                  <TableCell>
                    <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {lifeline.media_assets?.url ? (
                        <img
                          src={lifeline.media_assets.url}
                          alt={lifeline.title}
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${lifeline.media_assets.position_x || 50}% ${lifeline.media_assets.position_y || 50}%`
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{lifeline.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lifeline.collections?.title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lifeline.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lifelines/${lifeline.id}`);
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

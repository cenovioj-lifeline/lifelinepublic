import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
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

export default function Tags() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
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
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Manage taxonomy and categorization tags
          </p>
        </div>
        <Button onClick={() => navigate("/tags/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tags?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No tags found
                </TableCell>
              </TableRow>
            ) : (
              tags?.map((tag) => (
                <TableRow
                  key={tag.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tags/${tag.id}`)}
                >
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    {tag.category && <Badge variant="outline">{tag.category}</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tag.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tags/${tag.id}`);
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

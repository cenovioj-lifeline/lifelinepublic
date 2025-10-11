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

export default function Lifelines() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["lifelines", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("lifelines")
        .select("*, profiles(display_name), collections(title)")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lifelines..."
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
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lifelines?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
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
                  <TableCell className="font-medium">{lifeline.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lifeline.profiles?.display_name || lifeline.subject_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lifeline.collections?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lifeline.status === "published" ? "default" : "secondary"}>
                      {lifeline.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lifeline.visibility}</Badge>
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

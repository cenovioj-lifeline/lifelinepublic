import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowUpDown } from "lucide-react";
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

export default function Elections() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: elections, isLoading } = useQuery({
    queryKey: ["elections", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("mock_elections")
        .select("*, collections(title)")
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
          <h1 className="text-3xl font-bold tracking-tight">Mock Election Results</h1>
          <p className="text-muted-foreground">
            Manage mock election results and outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/elections-category-order")}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Order Categories
          </Button>
          <Button onClick={() => navigate("/elections/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New MER
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mock election results..."
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
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
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
            ) : elections?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No mock election results found
                </TableCell>
              </TableRow>
            ) : (
              elections?.map((election) => (
                <TableRow
                  key={election.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/elections/${election.id}`)}
                >
                  <TableCell className="font-medium">{election.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {election.collections?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={election.status === "published" ? "default" : "secondary"}>
                      {election.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(election.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/elections/${election.id}`);
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

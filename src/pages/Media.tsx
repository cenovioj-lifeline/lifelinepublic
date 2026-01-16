import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Plus, BookOpen, Play, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MediaType } from "@/types/media";

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  slug: string;
  status: string | null;
  updated_at: string;
  // Type-specific fields
  author_name?: string;
  publication_year?: number | null;
  genre?: string | null;
  _content_count?: number;
  season?: string | null;
  youtube_url?: string | null;
  podcast_url?: string | null;
}

type FilterType = 'all' | MediaType;

export default function Media() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ["admin-media", searchTerm, filter],
    queryFn: async () => {
      const items: MediaItem[] = [];

      // Fetch books
      if (filter === "all" || filter === "book") {
        let query = supabase.from("books").select("*").order("updated_at", { ascending: false });
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%`);
        }
        const { data: books, error } = await query;
        if (error) throw error;

        // Get content counts for each book
        const booksWithCounts = await Promise.all(
          (books || []).map(async (book) => {
            const { count } = await supabase
              .from("book_content")
              .select("*", { count: "exact", head: true })
              .eq("book_id", book.id);
            return {
              ...book,
              type: 'book' as MediaType,
              _content_count: count || 0,
            };
          })
        );
        items.push(...booksWithCounts);
      }

      // Fetch videos
      if (filter === "all" || filter === "video") {
        let query = supabase.from("videos").select("*").order("updated_at", { ascending: false });
        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`);
        }
        const { data: videos, error } = await query;
        if (!error && videos) {
          items.push(...videos.map(v => ({ ...v, type: 'video' as MediaType })));
        }
      }

      // Fetch podcasts
      if (filter === "all" || filter === "podcast") {
        let query = supabase.from("podcasts").select("*").order("updated_at", { ascending: false });
        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`);
        }
        const { data: podcasts, error } = await query;
        if (!error && podcasts) {
          items.push(...podcasts.map(p => ({ ...p, type: 'podcast' as MediaType })));
        }
      }

      // Sort all by updated_at
      items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      return items;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      if (item.type === 'book') {
        // Delete book content first
        await supabase.from("book_content").delete().eq("book_id", item.id);
        await supabase.from("profile_books").delete().eq("book_id", item.id);
        const { error } = await supabase.from("books").delete().eq("id", item.id);
        if (error) throw error;
      } else if (item.type === 'video') {
        const { error } = await supabase.from("videos").delete().eq("id", item.id);
        if (error) throw error;
      } else if (item.type === 'podcast') {
        const { error } = await supabase.from("podcasts").delete().eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast({
        title: "Deleted",
        description: `${itemToDelete?.type} has been deleted`,
      });
      setShowDeleteDialog(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const handleRowClick = (item: MediaItem) => {
    if (item.type === 'book') {
      navigate(`/media/books/${item.id}`);
    } else if (item.type === 'video') {
      navigate(`/media/videos/${item.id}`);
    } else if (item.type === 'podcast') {
      navigate(`/media/podcasts/${item.id}`);
    }
  };

  const getTypeBadge = (type: MediaType) => {
    const config = {
      book: { icon: BookOpen, label: "Book", variant: "default" as const },
      video: { icon: Play, label: "Video", variant: "secondary" as const },
      podcast: { icon: Mic, label: "Podcast", variant: "outline" as const },
    };
    const { icon: Icon, label, variant } = config[type];
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media</h1>
          <p className="text-muted-foreground">
            Manage books, videos, and podcasts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/media/books/new")} variant="default">
            <BookOpen className="h-4 w-4 mr-2" />
            Add Book
          </Button>
          <Button onClick={() => navigate("/media/videos/new")} variant="secondary">
            <Play className="h-4 w-4 mr-2" />
            Add Video
          </Button>
          <Button onClick={() => navigate("/media/podcasts/new")} variant="outline">
            <Mic className="h-4 w-4 mr-2" />
            Add Podcast
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="book">Books</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="podcast">Podcasts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Details</TableHead>
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
            ) : mediaItems?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No media found
                </TableCell>
              </TableRow>
            ) : (
              mediaItems?.map((item) => (
                <TableRow
                  key={`${item.type}-${item.id}`}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.type === 'book' && (
                      <>
                        {item.author_name}
                        {item.publication_year && ` (${item.publication_year})`}
                        {item._content_count !== undefined && (
                          <Badge variant="secondary" className="ml-2">
                            {item._content_count} items
                          </Badge>
                        )}
                      </>
                    )}
                    {item.type === 'video' && item.youtube_url && (
                      <span className="text-xs truncate max-w-[200px] inline-block">
                        {item.youtube_url}
                      </span>
                    )}
                    {item.type === 'podcast' && (
                      <>
                        {item.season && `Season ${item.season}`}
                        {item.podcast_url && (
                          <span className="text-xs truncate max-w-[200px] inline-block ml-2">
                            {item.podcast_url}
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "published" ? "default" : "secondary"}>
                      {item.status || "draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(item, e)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{itemToDelete?.title}</strong>?
              </p>
              {itemToDelete?.type === 'book' && (
                <>
                  <p className="text-sm">This will permanently delete:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>All book content (insights, frameworks, stories, etc.)</li>
                    <li>Profile book associations</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

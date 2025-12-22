import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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

interface Book {
  id: string;
  title: string;
  slug: string;
  author_name: string;
  author_profile_id: string | null;
  publication_year: number | null;
  status: string | null;
  genre: string | null;
  updated_at: string;
  _content_count?: number;
}

export default function Books() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("*")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get content counts for each book
      const booksWithCounts = await Promise.all(
        (data || []).map(async (book) => {
          const { count } = await supabase
            .from("book_content")
            .select("*", { count: "exact", head: true })
            .eq("book_id", book.id);
          return { ...book, _content_count: count || 0 };
        })
      );

      return booksWithCounts as Book[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      // Delete book content first
      const { error: contentError } = await supabase
        .from("book_content")
        .delete()
        .eq("book_id", bookId);
      if (contentError) throw contentError;

      // Delete profile_books associations
      const { error: profileBooksError } = await supabase
        .from("profile_books")
        .delete()
        .eq("book_id", bookId);
      if (profileBooksError) throw profileBooksError;

      // Delete the book
      const { error: bookError } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);
      if (bookError) throw bookError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast({
        title: "Book deleted",
        description: "Book and all its content have been deleted",
      });
      setShowDeleteDialog(false);
      setBookToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookToDelete(book);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (bookToDelete) {
      deleteMutation.mutate(bookToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books</h1>
          <p className="text-muted-foreground">
            Manage books and their content
          </p>
        </div>
        <Button onClick={() => navigate("/books/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Book
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search books..."
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
              <TableHead>Author</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : books?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No books found
                </TableCell>
              </TableRow>
            ) : (
              books?.map((book) => (
                <TableRow
                  key={book.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author_name}</TableCell>
                  <TableCell>{book.publication_year || "—"}</TableCell>
                  <TableCell>
                    {book.genre ? (
                      <Badge variant="outline">{book.genre}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {book._content_count} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={book.status === "published" ? "default" : "secondary"}>
                      {book.status || "draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(book.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/books/${book.id}`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(book, e)}
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
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{bookToDelete?.title}</strong>?
              </p>
              <p className="text-sm">This will permanently delete:</p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>All book content (insights, frameworks, stories, etc.)</li>
                <li>Profile book associations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Book"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { CONTENT_TYPE_CONFIG, ContentType } from "@/types/book";
import { BookCoverUpload } from "@/components/book/BookCoverUpload";

interface BookContent {
  id: string;
  book_id: string;
  content_type: string;
  title: string | null;
  content: string;
  chapter_reference: string | null;
  order_index: number | null;
  tags: string[] | null;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export default function BookEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const initialTab = searchParams.get("tab") || "metadata";

  // Get collection from URL params for new books
  const collectionFromUrl = searchParams.get("collection");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorProfileId, setAuthorProfileId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(collectionFromUrl);
  const [publicationYear, setPublicationYear] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [isbn, setIsbn] = useState("");
  const [genre, setGenre] = useState("");
  const [coreThesis, setCoreThesis] = useState("");
  const [oneSentenceSummary, setOneSentenceSummary] = useState("");
  const [whoShouldRead, setWhoShouldRead] = useState("");
  const [keyThemes, setKeyThemes] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Content editing state
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<BookContent | null>(null);
  const [contentType, setContentType] = useState<string>("insight");
  const [contentTitle, setContentTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [contentChapter, setContentChapter] = useState("");
  const [contentTags, setContentTags] = useState("");
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);

  // Fetch profiles for author dropdown
  const { data: profiles } = useQuery({
    queryKey: ["profiles-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch collections for dropdown
  const { data: collections } = useQuery({
    queryKey: ["collections-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch book data
  const { data: book, isLoading } = useQuery({
    queryKey: ["admin-book", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  // Fetch book content
  const { data: bookContent, isLoading: contentLoading } = useQuery({
    queryKey: ["admin-book-content", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_content")
        .select("*")
        .eq("book_id", id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as BookContent[];
    },
    enabled: !isNew && !!id,
  });

  // Set form state when book data loads
  useEffect(() => {
    if (book) {
      setTitle(book.title || "");
      setSlug(book.slug || "");
      setSubtitle(book.subtitle || "");
      setAuthorName(book.author_name || "");
      setAuthorProfileId(book.author_profile_id || null);
      setCollectionId(book.collection_id || null);
      setPublicationYear(book.publication_year?.toString() || "");
      setPageCount(book.page_count?.toString() || "");
      setIsbn(book.isbn || "");
      setGenre(book.genre || "");
      setCoreThesis(book.core_thesis || "");
      setOneSentenceSummary(book.one_sentence_summary || "");
      setWhoShouldRead(book.who_should_read || "");
      setKeyThemes(book.key_themes?.join(", ") || "");
      setThemeColor(book.theme_color || "");
      setStatus((book.status as "draft" | "published") || "draft");
      setCoverImageUrl(book.cover_image_url || "");
    }
  }, [book]);

  // Auto-generate slug from title for new books
  useEffect(() => {
    if (isNew && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isNew]);

  // Save book mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const bookData = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim() || null,
        author_name: authorName.trim(),
        author_profile_id: authorProfileId || null,
        collection_id: collectionId || null,
        publication_year: publicationYear ? parseInt(publicationYear) : null,
        page_count: pageCount ? parseInt(pageCount) : null,
        isbn: isbn.trim() || null,
        genre: genre.trim() || null,
        core_thesis: coreThesis.trim() || null,
        one_sentence_summary: oneSentenceSummary.trim() || null,
        who_should_read: whoShouldRead.trim() || null,
        key_themes: keyThemes.split(",").map(t => t.trim()).filter(Boolean),
        theme_color: themeColor.trim() || null,
        status,
        cover_image_url: coverImageUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("books")
          .insert(bookData)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from("books")
          .update(bookData)
          .eq("id", id);
        if (error) throw error;
        return { id };
      }
    },
    onSuccess: (data) => {
      toast.success(isNew ? "Book created successfully" : "Book saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["admin-book", id] });
      if (isNew) {
        navigate(`/media/books/${data.id}`);
      }
    },
    onError: (error: Error) => {
      console.error("Error saving book:", error);
      toast.error("Failed to save book: " + error.message);
    },
  });

  // Save content mutation
  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const contentData = {
        book_id: id!,
        content_type: contentType,
        title: contentTitle.trim() || null,
        content: contentText.trim(),
        chapter_reference: contentChapter.trim() || null,
        tags: contentTags.split(",").map(t => t.trim()).filter(Boolean),
        updated_at: new Date().toISOString(),
      };

      if (editingContent) {
        const { error } = await supabase
          .from("book_content")
          .update(contentData)
          .eq("id", editingContent.id);
        if (error) throw error;
      } else {
        // Get max order_index
        const { data: maxData } = await supabase
          .from("book_content")
          .select("order_index")
          .eq("book_id", id!)
          .order("order_index", { ascending: false })
          .limit(1);
        const nextOrder = (maxData?.[0]?.order_index || 0) + 1;

        const { error } = await supabase
          .from("book_content")
          .insert({ ...contentData, order_index: nextOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingContent ? "Content updated" : "Content added");
      queryClient.invalidateQueries({ queryKey: ["admin-book-content", id] });
      setContentDialogOpen(false);
      resetContentForm();
    },
    onError: (error: Error) => {
      toast.error("Failed to save content: " + error.message);
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from("book_content")
        .delete()
        .eq("id", contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Content deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-book-content", id] });
      setDeleteContentId(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete content: " + error.message);
    },
  });

  const resetContentForm = () => {
    setEditingContent(null);
    setContentType("insight");
    setContentTitle("");
    setContentText("");
    setContentChapter("");
    setContentTags("");
  };

  const openContentDialog = (content?: BookContent) => {
    if (content) {
      setEditingContent(content);
      setContentType(content.content_type);
      setContentTitle(content.title || "");
      setContentText(content.content);
      setContentChapter(content.chapter_reference || "");
      setContentTags(content.tags?.join(", ") || "");
    } else {
      resetContentForm();
    }
    setContentDialogOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!authorName.trim()) {
      toast.error("Author name is required");
      return;
    }
    saveMutation.mutate();
  };

  const handleSaveContent = () => {
    if (!contentText.trim()) {
      toast.error("Content is required");
      return;
    }
    saveContentMutation.mutate();
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Group content by type
  const contentByType = (bookContent || []).reduce((acc, item) => {
    const type = item.content_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, BookContent[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/media")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "Add New Book" : "Edit Book"}
          </h1>
          {!isNew && book && (
            <p className="text-muted-foreground">{book.title}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="cover">Cover Image</TabsTrigger>
          {!isNew && <TabsTrigger value="content">Content ({bookContent?.length || 0})</TabsTrigger>}
        </TabsList>

        {/* Metadata Tab */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="book-slug"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Book subtitle"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="authorName">Author Name *</Label>
                  <Input
                    id="authorName"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <Label htmlFor="authorProfile">Author Profile</Label>
                  <Select value={authorProfileId || "none"} onValueChange={(v) => setAuthorProfileId(v === "none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to profile (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked profile</SelectItem>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="collection">Collection</Label>
                  <Select value={collectionId || "none"} onValueChange={(v) => setCollectionId(v === "none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No collection</SelectItem>
                      {collections?.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="publicationYear">Publication Year</Label>
                  <Input
                    id="publicationYear"
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label htmlFor="pageCount">Page Count</Label>
                  <Input
                    id="pageCount"
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                    placeholder="300"
                  />
                </div>
                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-0-00-000000-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Non-fiction, Business, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <Select value={themeColor || "none"} onValueChange={(v) => setThemeColor(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No theme</SelectItem>
                      <SelectItem value="slate">Slate</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="amber">Amber</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="coreThesis">Core Thesis</Label>
                <Textarea
                  id="coreThesis"
                  value={coreThesis}
                  onChange={(e) => setCoreThesis(e.target.value)}
                  placeholder="The main argument or thesis of the book"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="oneSentenceSummary">One Sentence Summary</Label>
                <Textarea
                  id="oneSentenceSummary"
                  value={oneSentenceSummary}
                  onChange={(e) => setOneSentenceSummary(e.target.value)}
                  placeholder="A brief one-sentence summary"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="whoShouldRead">Who Should Read</Label>
                <Textarea
                  id="whoShouldRead"
                  value={whoShouldRead}
                  onChange={(e) => setWhoShouldRead(e.target.value)}
                  placeholder="Target audience for this book"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="keyThemes">Key Themes (comma-separated)</Label>
                <Input
                  id="keyThemes"
                  value={keyThemes}
                  onChange={(e) => setKeyThemes(e.target.value)}
                  placeholder="leadership, growth, strategy"
                />
              </div>

              <div>
                <Label htmlFor="status">Publication Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cover Image Tab */}
        <TabsContent value="cover">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isNew && book ? (
                <BookCoverUpload
                  book={{
                    id: book.id,
                    title: book.title,
                    authorName: book.author_name,
                    coverImageUrl: book.cover_image_url,
                    coverImageId: book.cover_image_id,
                  }}
                  onImageUpdate={() => queryClient.invalidateQueries({ queryKey: ["admin-book", id] })}
                />
              ) : (
                <p className="text-muted-foreground">Save the book first to upload a cover image.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        {!isNew && (
          <TabsContent value="content">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Book Content</CardTitle>
                <Button onClick={() => openContentDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : bookContent?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No content yet. Add insights, frameworks, stories, and more.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(contentByType).map(([type, items]) => (
                      <div key={type}>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Badge variant="outline">
                            {CONTENT_TYPE_CONFIG[type as ContentType]?.pluralLabel || type}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            ({items.length})
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {item.title || "Untitled"}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.content}
                                </p>
                                {item.chapter_reference && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Chapter: {item.chapter_reference}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openContentDialog(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteContentId(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Content Edit Dialog */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? "Edit Content" : "Add Content"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contentType">Content Type *</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contentTitle">Title</Label>
              <Input
                id="contentTitle"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="Content title (optional)"
              />
            </div>
            <div>
              <Label htmlFor="contentText">Content *</Label>
              <Textarea
                id="contentText"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="The main content..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="contentChapter">Chapter Reference</Label>
              <Input
                id="contentChapter"
                value={contentChapter}
                onChange={(e) => setContentChapter(e.target.value)}
                placeholder="e.g., Chapter 3"
              />
            </div>
            <div>
              <Label htmlFor="contentTags">Tags (comma-separated)</Label>
              <Input
                id="contentTags"
                value={contentTags}
                onChange={(e) => setContentTags(e.target.value)}
                placeholder="leadership, strategy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContent} disabled={saveContentMutation.isPending}>
              {saveContentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingContent ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Content Confirmation */}
      <AlertDialog open={!!deleteContentId} onOpenChange={() => setDeleteContentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteContentId && deleteContentMutation.mutate(deleteContentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteContentMutation.isPending}
            >
              {deleteContentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * BookDetailPage
 *
 * Public page for displaying a book's content feed.
 * Routes: /public/profiles/:profileSlug/books/:bookSlug
 *         /public/collections/:collectionSlug/profiles/:profileSlug/books/:bookSlug
 */

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBookData } from "@/hooks/useBookData";
import { PublicLayout } from "@/components/PublicLayout";
import { CollectionLayout } from "@/components/CollectionLayout";
import { BookFeedContent } from "@/components/book";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function BookDetailPage() {
  const { profileSlug, bookSlug, collectionSlug } = useParams<{
    profileSlug: string;
    bookSlug: string;
    collectionSlug?: string;
  }>();

  const navigate = useNavigate();
  const { data, isLoading, error } = useBookData(bookSlug);

  // Fetch collection data when in collection context
  const { data: collection } = useQuery({
    queryKey: ['collection-by-slug', collectionSlug],
    queryFn: async () => {
      if (!collectionSlug) return null;
      const { data, error } = await supabase
        .from('collections')
        .select('id, title, slug')
        .eq('slug', collectionSlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!collectionSlug,
  });

  // Apply color scheme when in collection context
  useColorScheme(collection?.id);

  const hasContext = !!collectionSlug && !!collection;

  // Loading state
  if (isLoading) {
    const loadingContent = (
      <div className="flex flex-col md:flex-row min-h-screen bg-muted/20">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-64 p-4 border-r space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-8 max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );

    if (hasContext) {
      return (
        <CollectionLayout
          collectionTitle={collection.title}
          collectionSlug={collection.slug}
          collectionId={collection.id}
        >
          {loadingContent}
        </CollectionLayout>
      );
    }

    return <PublicLayout>{loadingContent}</PublicLayout>;
  }

  // Error state
  if (error || !data) {
    const handleBack = () => {
      if (collectionSlug && profileSlug) {
        navigate(`/public/collections/${collectionSlug}/profiles/${profileSlug}`);
      } else if (profileSlug) {
        navigate(`/public/profiles/${profileSlug}`);
      } else {
        navigate('/');
      }
    };

    const errorContent = (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          The book you're looking for doesn't exist or may have been removed.
        </p>
        <Button onClick={handleBack}>
          <BookOpen className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
      </div>
    );

    if (hasContext) {
      return (
        <CollectionLayout
          collectionTitle={collection.title}
          collectionSlug={collection.slug}
          collectionId={collection.id}
        >
          {errorContent}
        </CollectionLayout>
      );
    }

    return <PublicLayout>{errorContent}</PublicLayout>;
  }

  const bookContent = (
    <BookFeedContent
      book={data.book}
      content={data.content}
      contentByType={data.contentByType}
      counts={data.counts}
      profileSlug={profileSlug}
      collectionSlug={collectionSlug}
      hasContext={hasContext}
      collectionId={collection?.id}
    />
  );

  if (hasContext) {
    return (
      <CollectionLayout
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        collectionId={collection.id}
      >
        {bookContent}
      </CollectionLayout>
    );
  }

  return <PublicLayout>{bookContent}</PublicLayout>;
}

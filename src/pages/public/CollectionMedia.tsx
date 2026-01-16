import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, BookOpen, Mic, Globe } from "lucide-react";
import { MediaCoverCard } from "@/components/media/MediaCoverCard";
import { VideoCard } from "@/components/media/VideoCard";
import { AppCard } from "@/components/media/AppCard";
import { MediaSection } from "@/components/media/MediaSection";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaType } from "@/types/media";

interface Book {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  author_name?: string;
  one_sentence_summary?: string;
  theme_color?: string;
  cover_image_url?: string;
  profileSlug?: string;
}

interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  youtube_url?: string;
}

interface Podcast {
  id: string;
  title: string;
  slug: string;
  season?: string;
  description?: string;
  thumbnail_url?: string;
  podcast_url?: string;
}

interface App {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  app_url?: string;
}

type MediaFilter = 'all' | MediaType;

export default function CollectionMedia() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MediaFilter>("all");

  // Fetch collection
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch books from profiles in this collection
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["collection-media-books", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      // Step 1: Get profiles in this collection
      const { data: profileConnections, error: pcError } = await supabase
        .from("profile_collections")
        .select("profile_id, profiles(id, slug)")
        .eq("collection_id", collection.id);

      if (pcError) throw pcError;
      if (!profileConnections || profileConnections.length === 0) return [];

      const profileIds = profileConnections.map((pc) => pc.profile_id);
      
      // Create a map of profile_id to profile slug
      const profileSlugMap = new Map(
        profileConnections.map((pc) => [pc.profile_id, (pc.profiles as any)?.slug])
      );

      // Step 2: Get books for these profiles
      const { data: profileBooks, error: pbError } = await supabase
        .from("profile_books")
        .select(`
          profile_id,
          display_order,
          book:books(
            id,
            title,
            slug,
            subtitle,
            author_name,
            one_sentence_summary,
            theme_color,
            cover_image_url
          )
        `)
        .in("profile_id", profileIds)
        .order("display_order", { ascending: true });

      if (pbError) throw pbError;
      if (!profileBooks || profileBooks.length === 0) return [];

      // Step 3: Transform books, dedupe if same book linked to multiple profiles
      const booksWithProfiles: Book[] = [];
      const seenBookIds = new Set<string>();

      for (const pb of profileBooks) {
        const book = pb.book as any;
        if (!book) continue;
        
        // Dedupe books
        if (seenBookIds.has(book.id)) continue;
        seenBookIds.add(book.id);

        booksWithProfiles.push({
          id: book.id,
          title: book.title,
          slug: book.slug,
          subtitle: book.subtitle,
          author_name: book.author_name,
          one_sentence_summary: book.one_sentence_summary,
          theme_color: book.theme_color,
          cover_image_url: book.cover_image_url,
          profileSlug: profileSlugMap.get(pb.profile_id),
        });
      }

      return booksWithProfiles;
    },
    enabled: !!collection?.id,
  });

  // Fetch videos for this collection
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["collection-media-videos", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("videos")
        .select("id, title, slug, description, thumbnail_url, youtube_url")
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Video[];
    },
    enabled: !!collection?.id,
  });

  // Fetch podcasts for this collection
  const { data: podcasts, isLoading: podcastsLoading } = useQuery({
    queryKey: ["collection-media-podcasts", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("podcasts")
        .select("id, title, slug, season, description, thumbnail_url, podcast_url")
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Podcast[];
    },
    enabled: !!collection?.id,
  });

  // Fetch apps for this collection
  const { data: apps, isLoading: appsLoading } = useQuery({
    queryKey: ["collection-media-apps", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("apps")
        .select("id, title, slug, description, thumbnail_url, app_url")
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as App[];
    },
    enabled: !!collection?.id,
  });

  const isLoading = collectionLoading || booksLoading || videosLoading || podcastsLoading || appsLoading;

  const handleBookClick = (book: Book) => {
    if (book.profileSlug) {
      navigate(`/public/collections/${slug}/profiles/${book.profileSlug}/books/${book.slug}?from=media`);
    } else {
      navigate(`/public/books/${book.slug}?from=media`);
    }
  };

  const handlePodcastClick = (podcast: Podcast) => {
    if (podcast.podcast_url) {
      window.open(podcast.podcast_url, '_blank');
    }
  };

  // Count items for each type
  const videoCount = videos?.length || 0;
  const bookCount = books?.length || 0;
  const podcastCount = podcasts?.length || 0;
  const appCount = apps?.length || 0;
  const totalCount = videoCount + bookCount + podcastCount + appCount;

  // Determine which types exist
  const hasVideos = videoCount > 0;
  const hasBooks = bookCount > 0;
  const hasPodcasts = podcastCount > 0;
  const hasApps = appCount > 0;
  const hasAnyMedia = totalCount > 0;

  // Count how many different types we have
  const typeCount = [hasVideos, hasBooks, hasPodcasts, hasApps].filter(Boolean).length;

  // Determine if we should show section headers (when "all" is selected and multiple types)
  const showSectionHeaders = filter === 'all' && typeCount > 1;

  // Filter media based on selection
  const filteredVideos = filter === 'all' || filter === 'video' ? videos || [] : [];
  const filteredBooks = filter === 'all' || filter === 'book' ? books || [] : [];
  const filteredPodcasts = filter === 'all' || filter === 'podcast' ? podcasts || [] : [];
  const filteredApps = filter === 'all' || filter === 'app' ? apps || [] : [];

  if (isLoading || !collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-10 w-48 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </CollectionLayout>
    );
  }

  // Render a flat grid (when filtered to a single type or only one type exists)
  const renderFlatGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {/* Videos */}
      {filteredVideos.map((video) => (
        <VideoCard
          key={`video-${video.id}`}
          title={video.title}
          description={video.description}
          youtubeUrl={video.youtube_url || ""}
          thumbnailUrl={video.thumbnail_url}
        />
      ))}
      
      {/* Books */}
      {filteredBooks.map((book) => (
        <MediaCoverCard
          key={`book-${book.id}`}
          type="book"
          title={book.title}
          subtitle={book.subtitle}
          description={book.one_sentence_summary}
          imageUrl={book.cover_image_url}
          themeColor={book.theme_color}
          onClick={() => handleBookClick(book)}
        />
      ))}
      
      {/* Podcasts */}
      {filteredPodcasts.map((podcast) => (
        <MediaCoverCard
          key={`podcast-${podcast.id}`}
          type="podcast"
          title={podcast.title}
          subtitle={podcast.season ? `Season ${podcast.season}` : undefined}
          description={podcast.description}
          imageUrl={podcast.thumbnail_url}
          onClick={() => handlePodcastClick(podcast)}
        />
      ))}

      {/* Apps */}
      {filteredApps.map((app) => (
        <AppCard
          key={`app-${app.id}`}
          title={app.title}
          description={app.description}
          appUrl={app.app_url || ""}
          thumbnailUrl={app.thumbnail_url}
        />
      ))}
    </div>
  );

  // Render sectioned layout (when "all" is selected and multiple types exist)
  const renderSectionedLayout = () => (
    <div className="space-y-10">
      {/* Videos Section */}
      {hasVideos && (
        <MediaSection type="video" count={videoCount}>
          {(videos || []).map((video) => (
            <VideoCard
              key={`video-${video.id}`}
              title={video.title}
              description={video.description}
              youtubeUrl={video.youtube_url || ""}
              thumbnailUrl={video.thumbnail_url}
            />
          ))}
        </MediaSection>
      )}

      {/* Books Section */}
      {hasBooks && (
        <MediaSection type="book" count={bookCount}>
          {(books || []).map((book) => (
            <MediaCoverCard
              key={`book-${book.id}`}
              type="book"
              title={book.title}
              subtitle={book.subtitle}
              description={book.one_sentence_summary}
              imageUrl={book.cover_image_url}
              themeColor={book.theme_color}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </MediaSection>
      )}

      {/* Podcasts Section */}
      {hasPodcasts && (
        <MediaSection type="podcast" count={podcastCount}>
          {(podcasts || []).map((podcast) => (
            <MediaCoverCard
              key={`podcast-${podcast.id}`}
              type="podcast"
              title={podcast.title}
              subtitle={podcast.season ? `Season ${podcast.season}` : undefined}
              description={podcast.description}
              imageUrl={podcast.thumbnail_url}
              onClick={() => handlePodcastClick(podcast)}
            />
          ))}
        </MediaSection>
      )}

      {/* Apps Section */}
      {hasApps && (
        <MediaSection type="app" count={appCount}>
          {(apps || []).map((app) => (
            <AppCard
              key={`app-${app.id}`}
              title={app.title}
              description={app.description}
              appUrl={app.app_url || ""}
              thumbnailUrl={app.thumbnail_url}
            />
          ))}
        </MediaSection>
      )}
    </div>
  );

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Play className="h-8 w-8 text-[hsl(var(--scheme-title-text))]" />
            <h1 className="text-4xl font-bold text-[hsl(var(--scheme-title-text))]">Media</h1>
          </div>
          <p className="text-lg text-[hsl(var(--scheme-cards-text))]">
            Books, videos, podcasts, and apps from this collection
          </p>
        </div>

        {/* Filter tabs - only show if we have multiple types */}
        {typeCount > 1 && (
          <Tabs value={filter} onValueChange={(v) => setFilter(v as MediaFilter)}>
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1">
                All ({totalCount})
              </TabsTrigger>
              {hasVideos && (
                <TabsTrigger value="video" className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  Videos ({videoCount})
                </TabsTrigger>
              )}
              {hasBooks && (
                <TabsTrigger value="book" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Books ({bookCount})
                </TabsTrigger>
              )}
              {hasPodcasts && (
                <TabsTrigger value="podcast" className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  Podcasts ({podcastCount})
                </TabsTrigger>
              )}
              {hasApps && (
                <TabsTrigger value="app" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Apps ({appCount})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}

        {hasAnyMedia ? (
          showSectionHeaders ? renderSectionedLayout() : renderFlatGrid()
        ) : (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--scheme-cards-text))]">No media content available yet.</p>
          </div>
        )}
      </div>
    </CollectionLayout>
  );
}
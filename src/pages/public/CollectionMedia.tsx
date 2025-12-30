import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";

// Theme color mapping for book covers (same as ProfileBooksSection)
const themeColorMap: Record<string, { bg: string; text: string }> = {
  slate: { bg: 'bg-slate-700', text: 'text-slate-100' },
  red: { bg: 'bg-red-700', text: 'text-red-100' },
  orange: { bg: 'bg-orange-700', text: 'text-orange-100' },
  amber: { bg: 'bg-amber-700', text: 'text-amber-100' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-100' },
  lime: { bg: 'bg-lime-700', text: 'text-lime-100' },
  green: { bg: 'bg-green-700', text: 'text-green-100' },
  emerald: { bg: 'bg-emerald-700', text: 'text-emerald-100' },
  teal: { bg: 'bg-teal-700', text: 'text-teal-100' },
  cyan: { bg: 'bg-cyan-700', text: 'text-cyan-100' },
  sky: { bg: 'bg-sky-700', text: 'text-sky-100' },
  blue: { bg: 'bg-blue-700', text: 'text-blue-100' },
  indigo: { bg: 'bg-indigo-700', text: 'text-indigo-100' },
  violet: { bg: 'bg-violet-700', text: 'text-violet-100' },
  purple: { bg: 'bg-purple-700', text: 'text-purple-100' },
  fuchsia: { bg: 'bg-fuchsia-700', text: 'text-fuchsia-100' },
  pink: { bg: 'bg-pink-700', text: 'text-pink-100' },
  rose: { bg: 'bg-rose-700', text: 'text-rose-100' },
};

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

export default function CollectionMedia() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

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

      // Step 2: Get books for these profiles (no status filter - match profile page behavior)
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

  const isLoading = collectionLoading || booksLoading;

  const handleBookClick = (book: Book) => {
    if (book.profileSlug) {
      // Add ?from=media so the book page knows to navigate back to Media
      navigate(`/public/collections/${slug}/profiles/${book.profileSlug}/books/${book.slug}?from=media`);
    } else {
      navigate(`/public/books/${book.slug}?from=media`);
    }
  };

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
            Books and content from this collection
          </p>
        </div>

        {books && books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map((book) => (
              <BookCoverCard
                key={book.id}
                book={book}
                onClick={() => handleBookClick(book)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--scheme-cards-text))]">No media content available yet.</p>
          </div>
        )}
      </div>
    </CollectionLayout>
  );
}

interface BookCoverCardProps {
  book: Book;
  onClick: () => void;
}

function BookCoverCard({ book, onClick }: BookCoverCardProps) {
  const themeColors = themeColorMap[book.theme_color || 'slate'] || themeColorMap.slate;
  const hasCoverImage = !!book.cover_image_url;

  return (
    <div
      className="group cursor-pointer space-y-2"
      onClick={onClick}
    >
      {/* Book Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-md transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.02]">
        {hasCoverImage ? (
          <img
            src={book.cover_image_url}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          /* Placeholder cover with theme color */
          <div className={`h-full w-full ${themeColors.bg} flex flex-col items-center justify-center p-4`}>
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-black/20" />
            
            {/* Title on cover */}
            <h3 className={`${themeColors.text} text-center font-serif text-sm sm:text-base font-bold leading-tight line-clamp-4 px-2`}>
              {book.title}
            </h3>
            
            {/* Subtitle if exists */}
            {book.subtitle && (
              <p className={`${themeColors.text}/80 text-center text-xs mt-2 line-clamp-2 px-2`}>
                {book.subtitle}
              </p>
            )}
            
            {/* Author name at bottom */}
            <p className={`${themeColors.text}/70 text-center text-xs mt-auto pt-4`}>
              {book.author_name}
            </p>
            
            {/* Decorative bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20" />
            
            {/* Spine effect */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30" />
          </div>
        )}
      </div>

      {/* Book Info Below Cover */}
      <div className="space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors text-[hsl(var(--scheme-card-text))]">
          {book.title}
        </h3>
        {book.one_sentence_summary && (
          <p className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
            {book.one_sentence_summary}
          </p>
        )}
      </div>
    </div>
  );
}

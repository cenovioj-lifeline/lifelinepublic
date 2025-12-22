/**
 * ProfileBooksSection
 *
 * Displays a "Books" grid on author profile pages with book-cover style cards.
 * Fetches books via useProfileBooks hook and renders clickable cover cards.
 */

import { useNavigate } from "react-router-dom";
import { useProfileBooks } from "@/hooks/useBookData";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import type { ProfileBook } from "@/types/book";

interface ProfileBooksSectionProps {
  profileSlug: string;
  collectionSlug?: string;
}

export function ProfileBooksSection({ profileSlug, collectionSlug }: ProfileBooksSectionProps) {
  const { data: books, isLoading, error } = useProfileBooks(profileSlug);
  const navigate = useNavigate();

  // Handle loading state
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Don't show section if no books or error
  if (error || !books || books.length === 0) {
    return null;
  }

  const handleBookClick = (book: ProfileBook) => {
    const basePath = collectionSlug
      ? `/public/collections/${collectionSlug}/profiles/${profileSlug}`
      : `/public/profiles/${profileSlug}`;
    navigate(`${basePath}/books/${book.slug}`);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Books</h2>
        <span className="text-sm text-muted-foreground">({books.length})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCoverCard
            key={book.id}
            book={book}
            onClick={() => handleBookClick(book)}
          />
        ))}
      </div>
    </section>
  );
}

interface BookCoverCardProps {
  book: ProfileBook;
  onClick: () => void;
}

// Theme color mapping for book covers
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

function BookCoverCard({ book, onClick }: BookCoverCardProps) {
  const themeColors = themeColorMap[book.themeColor || 'slate'] || themeColorMap.slate;
  const hasCoverImage = !!book.coverImageUrl;

  return (
    <div
      className="group cursor-pointer space-y-2"
      onClick={onClick}
    >
      {/* Book Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-md transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.02]">
        {hasCoverImage ? (
          <img
            src={book.coverImageUrl}
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
              {book.authorName}
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
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        {book.oneSentenceSummary && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {book.oneSentenceSummary}
          </p>
        )}
      </div>
    </div>
  );
}

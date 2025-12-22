/**
 * ProfileBooksSection
 *
 * Displays a "Books & Works" grid on author profile pages.
 * Fetches books via useProfileBooks hook and renders clickable cards.
 */

import { useNavigate } from "react-router-dom";
import { useProfileBooks } from "@/hooks/useBookData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, ChevronRight, Users } from "lucide-react";
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </Card>
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
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Books & Works</h2>
        <Badge variant="secondary" className="ml-2">
          {books.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => handleBookClick(book)}
          />
        ))}
      </div>
    </Card>
  );
}

interface BookCardProps {
  book: ProfileBook;
  onClick: () => void;
}

function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      className="group relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-primary/50 hover:bg-muted/50"
      onClick={onClick}
    >
      {/* Book Title */}
      <h3 className="font-semibold text-lg line-clamp-2 pr-6 group-hover:text-primary transition-colors">
        {book.title}
      </h3>

      {/* Subtitle */}
      {book.subtitle && (
        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
          {book.subtitle}
        </p>
      )}

      {/* Metadata Row */}
      <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
        {book.publicationYear && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {book.publicationYear}
          </span>
        )}
        {book.relationshipType === 'co-author' && (
          <span className="flex items-center gap-1 text-blue-600">
            <Users className="h-3.5 w-3.5" />
            Co-authored
          </span>
        )}
      </div>

      {/* Summary */}
      {book.oneSentenceSummary && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
          {book.oneSentenceSummary}
        </p>
      )}

      {/* Key Themes */}
      {book.keyThemes && book.keyThemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {book.keyThemes.slice(0, 3).map((theme, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {theme}
            </Badge>
          ))}
          {book.keyThemes.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{book.keyThemes.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Hover Arrow */}
      <ChevronRight className="absolute top-4 right-4 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

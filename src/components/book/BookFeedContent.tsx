/**
 * BookFeedContent
 *
 * Main layout component for the book detail page.
 * Combines sidebar, feed area, and metadata panel.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookSidebar } from "./BookSidebar";
import { BookFeedItem } from "./BookFeedItem";
import { BookDashboard } from "./BookDashboard";
import { BookMetadata } from "./BookMetadata";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { Pencil, Plus } from "lucide-react";
import type { Book, BookContent, ContentType } from "@/types/book";
import { CONTENT_TYPE_CONFIG } from "@/types/book";

interface BookFeedContentProps {
  book: Book;
  content: BookContent[];
  contentByType: Record<ContentType, BookContent[]>;
  counts: Record<ContentType, number>;
  profileSlug?: string;
  collectionSlug?: string;
  hasContext?: boolean;
  collectionId?: string;
  backDestination?: 'profile' | 'media';
}

export function BookFeedContent({
  book,
  content,
  contentByType,
  counts,
  profileSlug,
  collectionSlug,
  hasContext = false,
  collectionId,
  backDestination = 'profile',
}: BookFeedContentProps) {
  const navigate = useNavigate();
  const { hasAccess } = useAdminAccess();
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');

  const filteredContent = activeFilter === 'all'
    ? content
    : contentByType[activeFilter] || [];

  const handleBack = () => {
    // If user came from Media page, go back to Media
    if (backDestination === 'media' && collectionSlug) {
      navigate(`/public/collections/${collectionSlug}/media`);
    } else if (collectionSlug && profileSlug) {
      navigate(`/public/collections/${collectionSlug}/profiles/${profileSlug}`);
    } else if (profileSlug) {
      navigate(`/public/profiles/${profileSlug}`);
    } else {
      navigate(-1);
    }
  };

  // Determine back button label
  const backLabel = backDestination === 'media' ? 'Back to Media' : 'Back to Profile';

  return (
    <div 
      className="flex flex-col md:flex-row min-h-screen"
      style={{ backgroundColor: "hsl(220 14% 96%)" }}
    >
      {/* Left Sidebar - Filters */}
      <BookSidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
        onBackClick={handleBack}
        bookTitle={book.title}
        authorName={book.authorName}
        hasContext={hasContext}
        backLabel={backLabel}
      />

      {/* Main Feed Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        {/* Book Header (Mobile) */}
        <div className="mb-6 md:hidden">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{book.title}</h1>
              {book.subtitle && (
                <p className="text-lg mt-1 text-muted-foreground">{book.subtitle}</p>
              )}
              <p className="text-sm mt-2 text-muted-foreground">
                by {book.authorName}
                {book.publicationYear && ` (${book.publicationYear})`}
              </p>
            </div>
            {hasAccess && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/books/${book.id}`)}
                className="shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Admin Actions (Desktop) */}
        {hasAccess && (
          <div className="hidden md:flex gap-2 mb-6">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Book
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/books/${book.id}?tab=content`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>
        )}

        {/* Dashboard or Feed View */}
        {activeFilter === 'all' ? (
          <BookDashboard
            counts={counts}
            onSelectType={setActiveFilter}
            bookTitle={book.title}
            hasContext={hasContext}
          />
        ) : (
          <div className="space-y-8">
            {/* Filter Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {CONTENT_TYPE_CONFIG[activeFilter].pluralLabel}
              </h2>
              <Badge variant="outline">
                {filteredContent.length} {filteredContent.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>

            {/* Feed Items */}
            {filteredContent.length > 0 ? (
              filteredContent.map((item) => (
                <BookFeedItem
                  key={item.id}
                  item={item}
                  authorName={book.authorName}
                  hasContext={hasContext}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No {CONTENT_TYPE_CONFIG[activeFilter].pluralLabel.toLowerCase()} content yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Right Sidebar - Book Metadata (desktop only) */}
      <aside className="hidden xl:block w-80 p-6 border-l border-border sticky top-0 h-screen overflow-y-auto bg-background">
        <BookMetadata book={book} hasContext={hasContext} />
      </aside>
    </div>
  );
}

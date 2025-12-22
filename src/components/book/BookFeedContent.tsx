/**
 * BookFeedContent
 *
 * Main layout component for the book detail page.
 * Combines sidebar, feed area, and metadata panel.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { BookSidebar } from "./BookSidebar";
import { BookFeedItem } from "./BookFeedItem";
import { BookDashboard } from "./BookDashboard";
import { BookMetadata } from "./BookMetadata";
import type { Book, BookContent, ContentType } from "@/types/book";
import { CONTENT_TYPE_CONFIG } from "@/types/book";

interface BookFeedContentProps {
  book: Book;
  content: BookContent[];
  contentByType: Record<ContentType, BookContent[]>;
  counts: Record<ContentType, number>;
  profileSlug?: string;
  collectionSlug?: string;
}

export function BookFeedContent({
  book,
  content,
  contentByType,
  counts,
  profileSlug,
  collectionSlug,
}: BookFeedContentProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');

  const filteredContent = activeFilter === 'all'
    ? content
    : contentByType[activeFilter] || [];

  const handleBack = () => {
    if (collectionSlug && profileSlug) {
      navigate(`/public/collections/${collectionSlug}/profiles/${profileSlug}`);
    } else if (profileSlug) {
      navigate(`/public/profiles/${profileSlug}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muted/20">
      {/* Left Sidebar - Filters */}
      <BookSidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
        onBackClick={handleBack}
        bookTitle={book.title}
        authorName={book.authorName}
      />

      {/* Main Feed Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        {/* Book Header (Mobile) */}
        <div className="mb-6 md:hidden">
          <h1 className="text-2xl font-bold">{book.title}</h1>
          {book.subtitle && (
            <p className="text-lg text-muted-foreground mt-1">{book.subtitle}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            by {book.authorName}
            {book.publicationYear && ` (${book.publicationYear})`}
          </p>
        </div>

        {/* Dashboard or Feed View */}
        {activeFilter === 'all' ? (
          <BookDashboard
            counts={counts}
            onSelectType={setActiveFilter}
            bookTitle={book.title}
          />
        ) : (
          <div className="space-y-8">
            {/* Filter Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {CONTENT_TYPE_CONFIG[activeFilter].pluralLabel}
              </h2>
              <Badge variant="outline" className="text-muted-foreground">
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
      <aside className="hidden xl:block w-80 p-6 border-l sticky top-0 h-screen overflow-y-auto bg-background/50 backdrop-blur">
        <BookMetadata book={book} />
      </aside>
    </div>
  );
}

/**
 * BookMetadata
 *
 * Right sidebar showing book information.
 * Displays summary, thesis, themes, and book details.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, FileText, Users } from "lucide-react";
import type { Book } from "@/types/book";

interface BookMetadataProps {
  book: Book;
  hasContext?: boolean;
}

export function BookMetadata({ book, hasContext = false }: BookMetadataProps) {
  return (
    <div className="space-y-6">
      {/* Book Cover */}
      <div>
        <h3 
          className="font-bold mb-3 flex items-center gap-2"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
        >
          <BookOpen className="h-4 w-4" /> About The Book
        </h3>
        {(book.cover_image?.url || book.coverImageUrl) ? (
          <div 
            className="aspect-[2/3] rounded-lg shadow-lg mb-4 overflow-hidden border"
            style={{ borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(220 13% 91%)" }}
          >
            <img
              src={book.cover_image?.url || book.coverImageUrl}
              alt={`${book.title} cover`}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${book.cover_image?.position_x ?? 50}% ${book.cover_image?.position_y ?? 50}%`,
                transform: `scale(${book.cover_image?.scale ?? 1})`,
                transformOrigin: `${book.cover_image?.position_x ?? 50}% ${book.cover_image?.position_y ?? 50}%`
              }}
            />
          </div>
        ) : (
          <div 
            className="aspect-[2/3] rounded-lg shadow-inner mb-4 flex items-center justify-center text-white border-2 border-white/20 p-4"
            style={{ 
              background: hasContext 
                ? "linear-gradient(to bottom right, hsl(var(--scheme-nav-bg)), hsl(var(--scheme-nav-bg) / 0.8))"
                : "linear-gradient(to bottom right, hsl(220 9% 30%), hsl(220 9% 15%))"
            }}
          >
            <div className="text-center">
              <span className="font-bold text-lg leading-tight block">
                {book.title}
              </span>
              <span className="font-normal text-xs opacity-75 mt-2 block">
                {book.authorName}
              </span>
              {book.publicationYear && (
                <span className="font-normal text-xs opacity-50 mt-1 block">
                  {book.publicationYear}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* One-sentence summary */}
      {book.oneSentenceSummary && (
        <p 
          className="text-sm leading-relaxed"
          style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
        >
          {book.oneSentenceSummary}
        </p>
      )}

      {/* Core Thesis */}
      {book.coreThesis && (
        <div>
          <h4 
            className="text-xs font-bold uppercase mb-2"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
          >
            Core Thesis
          </h4>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
          >
            {book.coreThesis}
          </p>
        </div>
      )}

      {/* Who Should Read */}
      {book.whoShouldRead && (
        <div>
          <h4 
            className="text-xs font-bold uppercase mb-2 flex items-center gap-1"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
          >
            <Users className="h-3 w-3" /> Who Should Read
          </h4>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
          >
            {book.whoShouldRead}
          </p>
        </div>
      )}

      {/* Key Themes */}
      {book.keyThemes && book.keyThemes.length > 0 && (
        <div>
          <h4 
            className="text-xs font-bold uppercase mb-2"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
          >
            Key Themes
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {book.keyThemes.map((theme, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : undefined,
                  color: hasContext ? "hsl(var(--scheme-cards-text))" : undefined
                }}
              >
                {theme}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Book Details */}
      <div className="space-y-2 text-sm">
        {book.publicationYear && (
          <div 
            className="flex items-center gap-2"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
          >
            <Calendar className="h-4 w-4" />
            <span>Published {book.publicationYear}</span>
          </div>
        )}
        {book.pageCount && (
          <div 
            className="flex items-center gap-2"
            style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
          >
            <FileText className="h-4 w-4" />
            <span>{book.pageCount} pages</span>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <Button 
        className="w-full" 
        size="sm"
        style={{ 
          backgroundColor: hasContext ? "hsl(var(--scheme-nav-button))" : "hsl(220 9% 20%)",
          color: hasContext ? "hsl(var(--scheme-nav-text))" : "white"
        }}
      >
        Get the Book
      </Button>
    </div>
  );
}

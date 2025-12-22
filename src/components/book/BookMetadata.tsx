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
}

export function BookMetadata({ book }: BookMetadataProps) {
  return (
    <div className="space-y-6">
      {/* Book Cover Placeholder */}
      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> About The Book
        </h3>
        <div className="aspect-[2/3] bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-inner mb-4 flex items-center justify-center text-white border-2 border-white/20 p-4">
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
      </div>

      {/* One-sentence summary */}
      {book.oneSentenceSummary && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {book.oneSentenceSummary}
        </p>
      )}

      {/* Core Thesis */}
      {book.coreThesis && (
        <div>
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
            Core Thesis
          </h4>
          <p className="text-sm leading-relaxed">{book.coreThesis}</p>
        </div>
      )}

      {/* Who Should Read */}
      {book.whoShouldRead && (
        <div>
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Users className="h-3 w-3" /> Who Should Read
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {book.whoShouldRead}
          </p>
        </div>
      )}

      {/* Key Themes */}
      {book.keyThemes && book.keyThemes.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
            Key Themes
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {book.keyThemes.map((theme, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Book Details */}
      <div className="space-y-2 text-sm">
        {book.publicationYear && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Published {book.publicationYear}</span>
          </div>
        )}
        {book.pageCount && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{book.pageCount} pages</span>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white" size="sm">
        Get the Book
      </Button>
    </div>
  );
}

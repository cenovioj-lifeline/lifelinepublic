/**
 * useBookData Hook
 *
 * React Query hooks for fetching book data from Supabase.
 * - useBookData: Fetch a single book with all its content
 * - useProfileBooks: Fetch all books for a profile
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Book, BookContent, ProfileBook, ContentType, CONTENT_TYPES } from "@/types/book";

// Transform database row to Book type
function transformBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    authorProfileId: row.author_profile_id,
    authorName: row.author_name,
    publicationYear: row.publication_year,
    pageCount: row.page_count,
    coreThesis: row.core_thesis,
    oneSentenceSummary: row.one_sentence_summary,
    whoShouldRead: row.who_should_read,
    keyThemes: row.key_themes,
    coverImageUrl: row.cover_image_url,
    coverImagePath: row.cover_image_path,
    coverImageId: row.cover_image_id,
    themeColor: row.theme_color || 'slate',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Include joined cover_image if present
    cover_image: row.cover_image ? {
      id: row.cover_image.id,
      url: row.cover_image.url,
      alt_text: row.cover_image.alt_text,
      position_x: row.cover_image.position_x,
      position_y: row.cover_image.position_y,
      scale: row.cover_image.scale,
    } : undefined,
  };
}

// Transform database row to BookContent type
function transformContent(row: any): BookContent {
  return {
    id: row.id,
    bookId: row.book_id,
    contentType: row.content_type as ContentType,
    visualType: row.visual_type,
    title: row.title,
    content: row.content,
    chapterReference: row.chapter_reference,
    rating: row.rating,
    tags: row.tags,
    relatedTo: row.related_to,
    extendedData: row.extended_data || {},
    orderIndex: row.order_index,
    likes: row.likes || 0,
    comments: row.comments || 0,
    createdAt: row.created_at,
  };
}

// Group content by type
function groupContentByType(content: BookContent[]): Record<ContentType, BookContent[]> {
  const groups: Record<string, BookContent[]> = {
    insight: [],
    framework: [],
    story: [],
    quote: [],
    practical_use: [],
  };

  content.forEach((item) => {
    if (groups[item.contentType]) {
      groups[item.contentType].push(item);
    }
  });

  return groups as Record<ContentType, BookContent[]>;
}

/**
 * Fetch a single book with all its content
 */
export function useBookData(bookSlug: string | undefined) {
  return useQuery({
    queryKey: ["book", bookSlug],
    enabled: !!bookSlug,
    queryFn: async () => {
      if (!bookSlug) return null;

      // 1. Fetch book metadata with cover_image relationship
      const { data: bookRow, error: bookError } = await supabase
        .from("books")
        .select(`
          *,
          cover_image:media_assets!cover_image_id(
            id, url, alt_text, position_x, position_y, scale
          )
        `)
        .eq("slug", bookSlug)
        .maybeSingle();

      if (bookError) throw bookError;
      if (!bookRow) return null;

      const book = transformBook(bookRow);

      // 2. Fetch author profile image if author_profile_id exists
      let authorImageUrl: string | undefined;
      if (book.authorProfileId) {
        const { data: authorProfile } = await supabase
          .from("profiles")
          .select("primary_image_url")
          .eq("id", book.authorProfileId)
          .maybeSingle();
        
        if (authorProfile?.primary_image_url) {
          authorImageUrl = authorProfile.primary_image_url;
        }
      }

      // 3. Fetch all content for this book
      const { data: contentRows, error: contentError } = await supabase
        .from("book_content")
        .select("*")
        .eq("book_id", book.id)
        .order("order_index", { ascending: true });

      if (contentError) throw contentError;

      const content = (contentRows || []).map(transformContent);
      const contentByType = groupContentByType(content);

      // 4. Calculate counts per type
      const counts: Record<ContentType, number> = {
        insight: contentByType.insight.length,
        framework: contentByType.framework.length,
        story: contentByType.story.length,
        quote: contentByType.quote.length,
        practical_use: contentByType.practical_use.length,
      };

      return {
        book,
        content,
        contentByType,
        counts,
        totalCount: content.length,
        authorImageUrl,
      };
    },
  });
}

/**
 * Fetch all books for a profile (via profile_books junction)
 */
export function useProfileBooks(profileSlug: string | undefined) {
  return useQuery({
    queryKey: ["profile-books", profileSlug],
    enabled: !!profileSlug,
    queryFn: async () => {
      if (!profileSlug) return [];

      // 1. Get profile ID from slug
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", profileSlug)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return [];

      // 2. Get books via profile_books junction with cover_image
      const { data: profileBooks, error: pbError } = await supabase
        .from("profile_books")
        .select(`
          display_order,
          relationship_type,
          book:books(
            *,
            cover_image:media_assets!cover_image_id(
              id, url, alt_text, position_x, position_y, scale
            )
          )
        `)
        .eq("profile_id", profile.id)
        .order("display_order", { ascending: true });

      if (pbError) throw pbError;
      if (!profileBooks) return [];

      // 3. Transform to ProfileBook type
      return profileBooks
        .filter((pb: any) => pb.book) // Filter out null books
        .map((pb: any): ProfileBook => ({
          ...transformBook(pb.book),
          relationshipType: pb.relationship_type || 'author',
          displayOrder: pb.display_order || 0,
        }));
    },
  });
}

/**
 * Fetch books by author profile ID directly (alternative to useProfileBooks)
 */
export function useAuthorBooks(authorProfileId: string | undefined) {
  return useQuery({
    queryKey: ["author-books", authorProfileId],
    enabled: !!authorProfileId,
    queryFn: async () => {
      if (!authorProfileId) return [];

      const { data: books, error } = await supabase
        .from("books")
        .select("*")
        .eq("author_profile_id", authorProfileId)
        .order("publication_year", { ascending: false });

      if (error) throw error;

      return (books || []).map(transformBook);
    },
  });
}

/**
 * Get content counts for a book (lighter query than full book data)
 */
export function useBookContentCounts(bookId: string | undefined) {
  return useQuery({
    queryKey: ["book-content-counts", bookId],
    enabled: !!bookId,
    queryFn: async () => {
      if (!bookId) return null;

      const { data, error } = await supabase
        .from("book_content")
        .select("content_type")
        .eq("book_id", bookId);

      if (error) throw error;

      const counts: Record<ContentType, number> = {
        insight: 0,
        framework: 0,
        story: 0,
        quote: 0,
        practical_use: 0,
      };

      (data || []).forEach((row: any) => {
        if (counts[row.content_type as ContentType] !== undefined) {
          counts[row.content_type as ContentType]++;
        }
      });

      return counts;
    },
  });
}

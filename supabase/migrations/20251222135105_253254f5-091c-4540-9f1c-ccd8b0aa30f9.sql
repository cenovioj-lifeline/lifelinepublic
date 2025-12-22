-- Migration: Create Books Feature Tables
-- Date: 2025-12-22

-- 1. BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    author_profile_id UUID REFERENCES profiles(id),
    author_name TEXT NOT NULL,
    publication_year INTEGER,
    page_count INTEGER,
    isbn TEXT,
    genre TEXT,
    core_thesis TEXT,
    one_sentence_summary TEXT,
    who_should_read TEXT,
    cover_image_url TEXT,
    cover_image_path TEXT,
    theme_color TEXT DEFAULT 'bg-slate-700',
    key_themes TEXT[],
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);

-- 2. BOOK_CONTENT TABLE
CREATE TABLE IF NOT EXISTS book_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('insight', 'framework', 'story', 'quote', 'practical_use')),
    visual_type TEXT,
    title TEXT,
    content TEXT NOT NULL,
    chapter_reference TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    tags TEXT[],
    related_to TEXT[],
    extended_data JSONB DEFAULT '{}',
    order_index INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_content_book ON book_content(book_id);
CREATE INDEX IF NOT EXISTS idx_book_content_type ON book_content(content_type);

-- 3. PROFILE_BOOKS TABLE
CREATE TABLE IF NOT EXISTS profile_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'author',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_books_profile ON profile_books(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_books_book ON profile_books(book_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_books ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES - Public read access
CREATE POLICY "Public read access for books" ON books FOR SELECT USING (true);
CREATE POLICY "Public read access for book_content" ON book_content FOR SELECT USING (true);
CREATE POLICY "Public read access for profile_books" ON profile_books FOR SELECT USING (true);

-- 6. RLS POLICIES - Admin/Editor management
CREATE POLICY "Admins and editors can manage books" 
  ON books FOR ALL 
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Admins and editors can manage book_content" 
  ON book_content FOR ALL 
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Admins and editors can manage profile_books" 
  ON profile_books FOR ALL 
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));
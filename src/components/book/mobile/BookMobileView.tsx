/**
 * BookMobileView
 * 
 * Main orchestrator for book mobile experience.
 * Combines all mobile components and manages view state.
 */

import { useState } from 'react';
import { useBookMobileNavigation } from '@/hooks/useBookMobileNavigation';
import { FloatingBackButton } from '@/components/FloatingBackButton';
import { BookMobileBottomTabs } from './BookMobileBottomTabs';
import { BookMobileDashboard } from './BookMobileDashboard';
import { BookCategoryModal } from './BookCategoryModal';
import { BookMobileList } from './BookMobileList';
import { BookDetailModal } from './BookDetailModal';
import type { Book, BookContent, ContentType } from '@/types/book';

interface BookMobileViewProps {
  book: Book;
  content: BookContent[];
  contentByType: Record<ContentType, BookContent[]>;
  counts: Record<ContentType, number>;
  authorImageUrl?: string;
  hasContext?: boolean;
}

export function BookMobileView({
  book,
  content,
  contentByType,
  counts,
  authorImageUrl,
  hasContext = false,
}: BookMobileViewProps) {
  const [modalCategory, setModalCategory] = useState<ContentType | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const nav = useBookMobileNavigation({ contentByType });

  // Handle dashboard tile tap -> show modal
  const handleTileSelect = (category: ContentType) => {
    setModalCategory(category);
  };

  // Handle modal "View" button -> go to list
  const handleViewCategory = () => {
    if (modalCategory) {
      nav.showCategory(modalCategory);
      setModalCategory(null);
      setShowInfoModal(false);
    }
  };

  // Handle bottom tab tap -> go directly to list
  const handleTabSelect = (category: ContentType) => {
    nav.jumpToCategory(category);
  };

  // Handle title click in list view -> show info modal
  const handleTitleClick = () => {
    if (nav.activeCategory) {
      setModalCategory(nav.activeCategory);
      setShowInfoModal(true);
    }
  };

  // Close info modal (without navigating)
  const handleCloseInfoModal = () => {
    setModalCategory(null);
    setShowInfoModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content area */}
      {nav.activeView === 'dashboard' && (
        <BookMobileDashboard
          counts={counts}
          onSelectTile={handleTileSelect}
          bookTitle={book.title}
          hasContext={hasContext}
        />
      )}

      {nav.activeView === 'list' && nav.activeCategory && (
        <BookMobileList
          category={nav.activeCategory}
          items={nav.currentItems}
          onBack={nav.showDashboard}
          onSelectItem={nav.openItem}
          onTitleClick={handleTitleClick}
          hasContext={hasContext}
        />
      )}

      {/* Bottom tabs - always visible except in detail view */}
      {nav.activeView !== 'detail' && (
        <BookMobileBottomTabs
          activeCategory={nav.activeCategory}
          counts={counts}
          onSelectCategory={handleTabSelect}
          hasContext={hasContext}
        />
      )}

      {/* Category explanation modal - from dashboard OR title click */}
      {modalCategory && (
        <BookCategoryModal
          category={modalCategory}
          count={counts[modalCategory] || 0}
          onClose={handleCloseInfoModal}
          onViewCategory={showInfoModal ? handleCloseInfoModal : handleViewCategory}
          hasContext={hasContext}
        />
      )}

      {/* Detail modal */}
      {nav.activeView === 'detail' && nav.currentItem && nav.activeCategory && (
        <BookDetailModal
          item={nav.currentItem}
          category={nav.activeCategory}
          authorName={book.authorName}
          authorImageUrl={authorImageUrl}
          positionLabel={nav.positionLabel}
          canGoNext={nav.canGoNext}
          canGoPrev={nav.canGoPrev}
          onClose={nav.closeItem}
          onNext={nav.nextItem}
          onPrev={nav.prevItem}
          hasContext={hasContext}
        />
      )}

      {/* Floating back button */}
      <FloatingBackButton />
    </div>
  );
}

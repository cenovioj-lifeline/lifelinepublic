/**
 * useBookMobileNavigation
 * 
 * State management hook for book mobile navigation.
 * Tracks active view, category, and item position for swipe navigation.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ContentType, BookContent } from '@/types/book';

export type MobileView = 'dashboard' | 'list' | 'detail';

interface UseBookMobileNavigationProps {
  contentByType: Record<ContentType, BookContent[]>;
}

export function useBookMobileNavigation({ contentByType }: UseBookMobileNavigationProps) {
  const [activeView, setActiveView] = useState<MobileView>('dashboard');
  const [activeCategory, setActiveCategory] = useState<ContentType | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Get items for current category
  const currentItems = useMemo(() => {
    if (!activeCategory) return [];
    return contentByType[activeCategory] || [];
  }, [activeCategory, contentByType]);

  // Current item
  const currentItem = useMemo(() => {
    return currentItems[currentItemIndex] || null;
  }, [currentItems, currentItemIndex]);

  // Navigation state
  const canGoNext = currentItemIndex < currentItems.length - 1;
  const canGoPrev = currentItemIndex > 0;
  const positionLabel = currentItems.length > 0 
    ? `${currentItemIndex + 1} of ${currentItems.length}`
    : '';

  // Actions
  const showDashboard = useCallback(() => {
    setActiveView('dashboard');
    setActiveCategory(null);
    setCurrentItemIndex(0);
  }, []);

  const showCategory = useCallback((category: ContentType) => {
    setActiveCategory(category);
    setActiveView('list');
    setCurrentItemIndex(0);
  }, []);

  const openItem = useCallback((index: number) => {
    setCurrentItemIndex(index);
    setActiveView('detail');
  }, []);

  const closeItem = useCallback(() => {
    setActiveView('list');
  }, []);

  const nextItem = useCallback(() => {
    if (canGoNext) {
      setCurrentItemIndex(prev => prev + 1);
    }
  }, [canGoNext]);

  const prevItem = useCallback(() => {
    if (canGoPrev) {
      setCurrentItemIndex(prev => prev - 1);
    }
  }, [canGoPrev]);

  // Direct category jump from bottom tabs
  const jumpToCategory = useCallback((category: ContentType) => {
    setActiveCategory(category);
    setActiveView('list');
    setCurrentItemIndex(0);
  }, []);

  return {
    // State
    activeView,
    activeCategory,
    currentItemIndex,
    currentItems,
    currentItem,
    
    // Computed
    canGoNext,
    canGoPrev,
    positionLabel,
    
    // Actions
    showDashboard,
    showCategory,
    openItem,
    closeItem,
    nextItem,
    prevItem,
    jumpToCategory,
  };
}

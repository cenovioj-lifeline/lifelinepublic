import { useState, useCallback, useMemo } from 'react';
import { MobileSuperlative, MobileCategory, NavigationItem, buildNavigationList } from '@/utils/electionDataAdapter';

export const useMobileElectionNavigation = (categories: MobileCategory[]) => {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Build flat navigation list
  const navigationList = useMemo(() => buildNavigationList(categories), [categories]);

  // Get current item
  const currentItem = currentIndex !== null ? navigationList[currentIndex] : null;

  const openDetail = useCallback((superlative: MobileSuperlative) => {
    // Find the superlative in the navigation list
    const index = navigationList.findIndex(
      item => item.type === 'superlative' && item.superlative.id === superlative.id
    );
    if (index !== -1) {
      setCurrentIndex(index);
      setIsDetailOpen(true);
    }
  }, [navigationList]);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setCurrentIndex(null), 300);
  }, []);

  const navigateDetail = useCallback((direction: 'prev' | 'next') => {
    if (currentIndex === null) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < navigationList.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, navigationList]);

  const canNavigate = useCallback((direction: 'prev' | 'next'): boolean => {
    if (currentIndex === null) return false;

    return direction === 'next' 
      ? currentIndex < navigationList.length - 1
      : currentIndex > 0;
  }, [currentIndex, navigationList]);

  return {
    currentItem,
    isDetailOpen,
    openDetail,
    closeDetail,
    navigateDetail,
    canNavigate,
  };
};

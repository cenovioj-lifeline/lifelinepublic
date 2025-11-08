import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useMobileEntryNavigation = (totalEntries: number) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize from URL on mount
  useEffect(() => {
    const entryParam = searchParams.get('entry');
    if (entryParam) {
      const index = parseInt(entryParam, 10);
      if (!isNaN(index) && index >= 0 && index < totalEntries) {
        setCurrentIndex(index);
      }
    }
  }, [searchParams, totalEntries]);

  // Update URL when index changes
  const navigateToEntry = useCallback((index: number) => {
    if (index < 0 || index >= totalEntries) return;
    
    setCurrentIndex(index);
    setSearchParams({ entry: index.toString() }, { replace: true });
  }, [totalEntries, setSearchParams]);

  const goToNext = useCallback(() => {
    if (currentIndex < totalEntries - 1) {
      navigateToEntry(currentIndex + 1);
    }
  }, [currentIndex, totalEntries, navigateToEntry]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigateToEntry(currentIndex - 1);
    }
  }, [currentIndex, navigateToEntry]);

  const canGoNext = currentIndex < totalEntries - 1;
  const canGoPrevious = currentIndex > 0;

  return {
    currentIndex,
    navigateToEntry,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
  };
};

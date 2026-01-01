import { useState, useCallback } from "react";

export interface ProfileAward {
  id: string;
  category: string;
  superlative_category?: string;
  notes?: string;
  winner_name?: string;
  percentage?: number;
  vote_count?: number;
  election: {
    id: string;
    title: string;
    slug: string;
    collection_id?: string;
  };
}

interface UseProfileAwardNavigationReturn {
  currentIndex: number;
  isDetailOpen: boolean;
  currentAward: ProfileAward | null;
  openDetail: (index: number) => void;
  closeDetail: () => void;
  navigateDetail: (direction: 'prev' | 'next') => void;
  canNavigate: (direction: 'prev' | 'next') => boolean;
}

export function useProfileAwardNavigation(awards: ProfileAward[]): UseProfileAwardNavigationReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const currentAward = awards[currentIndex] ?? null;

  const openDetail = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  const canNavigate = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      return currentIndex > 0;
    }
    return currentIndex < awards.length - 1;
  }, [currentIndex, awards.length]);

  const navigateDetail = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && canNavigate('prev')) {
      setCurrentIndex(prev => prev - 1);
    } else if (direction === 'next' && canNavigate('next')) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canNavigate]);

  return {
    currentIndex,
    isDetailOpen,
    currentAward,
    openDetail,
    closeDetail,
    navigateDetail,
    canNavigate,
  };
}

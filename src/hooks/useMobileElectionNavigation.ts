import { useState, useCallback } from 'react';
import { MobileSuperlative, MobileCategory } from '@/utils/electionDataAdapter';

export const useMobileElectionNavigation = (categories: MobileCategory[]) => {
  const [selectedSuperlative, setSelectedSuperlative] = useState<MobileSuperlative | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = useCallback((superlative: MobileSuperlative) => {
    setSelectedSuperlative(superlative);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedSuperlative(null), 300);
  }, []);

  const navigateDetail = useCallback((direction: 'prev' | 'next') => {
    if (!selectedSuperlative) return;

    const currentCategory = categories.find(c => c.id === selectedSuperlative.category.toLowerCase().replace(/\s+/g, '-'));
    if (!currentCategory) return;

    const currentIndex = currentCategory.superlatives.findIndex(s => s.id === selectedSuperlative.id);
    if (currentIndex === -1) return;

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < currentCategory.superlatives.length) {
      setSelectedSuperlative(currentCategory.superlatives[newIndex]);
    }
  }, [selectedSuperlative, categories]);

  const canNavigate = useCallback((direction: 'prev' | 'next'): boolean => {
    if (!selectedSuperlative) return false;

    const currentCategory = categories.find(c => c.id === selectedSuperlative.category.toLowerCase().replace(/\s+/g, '-'));
    if (!currentCategory) return false;

    const currentIndex = currentCategory.superlatives.findIndex(s => s.id === selectedSuperlative.id);
    if (currentIndex === -1) return false;

    return direction === 'next' 
      ? currentIndex < currentCategory.superlatives.length - 1
      : currentIndex > 0;
  }, [selectedSuperlative, categories]);

  return {
    selectedSuperlative,
    isDetailOpen,
    openDetail,
    closeDetail,
    navigateDetail,
    canNavigate,
  };
};

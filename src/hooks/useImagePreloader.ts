import { useEffect } from 'react';

export const useImagePreloader = (imageUrls: (string | null)[], currentIndex: number) => {
  useEffect(() => {
    const preloadImages: HTMLImageElement[] = [];
    
    // Preload next 2 and previous 1 image
    const indicesToPreload = [
      currentIndex + 1,
      currentIndex + 2,
      currentIndex - 1,
    ].filter(index => index >= 0 && index < imageUrls.length);
    
    indicesToPreload.forEach(index => {
      const url = imageUrls[index];
      if (url) {
        const img = new Image();
        img.src = url;
        preloadImages.push(img);
      }
    });
    
    // Cleanup function
    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [imageUrls, currentIndex]);
};

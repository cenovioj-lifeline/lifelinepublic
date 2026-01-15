import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import {
  categories,
  bookMeta,
  topics,
  getCardsByCategory,
  getTotalCardCount,
  getCardCountByCategory,
  type Card,
  type Topic
} from "@/data/pitchContent";

// Category colors for book headers - used by topic/filtered/modal views
const categoryColors: Record<string, string> = {
  vision: '#0f766e',   // Teal - matches site theme
  product: '#1d4ed8',  // Blue - tech, product
  business: '#b45309', // Amber - business, value
  founder: '#6d28d9',  // Violet - personal, wisdom
};

// Category Icon Component - renders SVG icons for each category
function CategoryIcon({ category, className = "" }: { category: string; className?: string }) {
  const iconClass = `w-5 h-5 ${className}`;
  
  switch (category) {
    case 'vision':
      // Eye icon
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'product':
      // Monitor icon
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case 'business':
      // Dollar circle icon
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M14.5 9a2.5 2.5 0 00-2.5-2.5h-1a2.5 2.5 0 000 5h2a2.5 2.5 0 010 5h-1a2.5 2.5 0 01-2.5-2.5" />
          <path d="M12 4.5v2m0 11v2" />
        </svg>
      );
    case 'founder':
      // Person icon
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21a6.5 6.5 0 0113 0" />
        </svg>
      );
    default:
      return null;
  }
}

// Book cover gradient styles (kept for topic view sidebar)
const bookGradients: Record<string, string> = {
  c1: 'linear-gradient(135deg, #2d5a4a, #1a3a30)',
  c2: 'linear-gradient(135deg, #4a5568, #2d3748)',
  c3: 'linear-gradient(135deg, #c05621, #9c4221)',
  c4: 'linear-gradient(135deg, #6b46c1, #553c9a)',
  c5: 'linear-gradient(135deg, #2b6cb0, #2c5282)',
  c6: 'linear-gradient(135deg, #d69e2e, #b7791f)',
  c7: 'linear-gradient(135deg, #38a169, #276749)',
  c8: 'linear-gradient(135deg, #e53e3e, #c53030)',
  c9: 'linear-gradient(135deg, #805ad5, #6b46c1)',
  c10: 'linear-gradient(135deg, #1a202c, #2d3748)',
  c11: 'linear-gradient(135deg, #319795, #285e61)',
  c12: 'linear-gradient(135deg, #744210, #5d3a0a)',
};

type ViewType = 'hub' | 'topic' | 'filtered';

interface FilteredCard extends Card {
  topicNum: number;
  topicTitle: string;
}

export default function CollectionPitch() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { hasAccess: isAdmin } = useAdminAccess();
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [uploadingBook, setUploadingBook] = useState<number | null>(null);

  // State
  const [currentView, setCurrentView] = useState<ViewType>('hub');
  const [currentTopic, setCurrentTopic] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [filteredCards, setFilteredCards] = useState<FilteredCard[]>([]);

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection-pitch", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug, description")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch book images
  const { data: bookImages } = useQuery({
    queryKey: ["pitch-book-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pitch_book_images")
        .select("book_num, image_url, image_path");

      if (error) throw error;
      return data || [];
    },
  });

  // Create a map of book_num -> image_url
  const bookImageMap = (bookImages || []).reduce((acc, img) => {
    acc[img.book_num] = img.image_url;
    return acc;
  }, {} as Record<number, string>);

  // Handle image upload for a book
  const handleImageUpload = async (bookNum: number, file: File) => {
    try {
      setUploadingBook(bookNum);
      const { url, path } = await uploadImage(file, "media-uploads");
      
      // Upsert to pitch_book_images
      const { error } = await supabase
        .from("pitch_book_images")
        .upsert(
          { book_num: bookNum, image_url: url, image_path: path },
          { onConflict: "book_num" }
        );

      if (error) throw error;

      toast.success("Image uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["pitch-book-images"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingBook(null);
    }
  };

  // Get current cards based on view
  const getCurrentCards = useCallback((): FilteredCard[] => {
    if (currentView === 'filtered' && currentFilter !== 'all') {
      return getCardsByCategory(currentFilter);
    }
    if (currentView === 'topic' && currentTopic) {
      const topic = topics[currentTopic];
      if (topic) {
        return topic.cards.map(card => ({
          ...card,
          topicNum: currentTopic,
          topicTitle: topic.title
        }));
      }
    }
    return [];
  }, [currentView, currentFilter, currentTopic]);

  // Update filtered cards when view changes
  useEffect(() => {
    setFilteredCards(getCurrentCards());
  }, [getCurrentCards]);

  // Keyboard navigation for mobile modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;

      if (e.key === 'Escape') {
        setModalOpen(false);
      } else if (e.key === 'ArrowLeft' && currentCardIndex > 0) {
        setCurrentCardIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentCardIndex < filteredCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, currentCardIndex, filteredCards.length]);

  // Handlers
  const handleFilterClick = (filterKey: string) => {
    // If clicking the same filter again (and it's not 'all'), unselect it
    if (filterKey === currentFilter && filterKey !== 'all') {
      setCurrentFilter('all');
      setCurrentView('hub');
      return;
    }
    
    setCurrentFilter(filterKey);
    if (filterKey === 'all') {
      setCurrentView('hub');
    }
  };

  const handleViewFiltered = () => {
    setCurrentView('filtered');
    setFilteredCards(getCardsByCategory(currentFilter));
  };

  const handleBookClick = (topicNum: number) => {
    setCurrentTopic(topicNum);
    setCurrentView('topic');
  };

  const handleBack = () => {
    setCurrentView('hub');
    setCurrentTopic(null);
  };

  // Mobile-only: card click opens modal
  const handleMobileCardClick = (index: number) => {
    setCurrentCardIndex(index);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleModalPrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const handleModalNext = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </CollectionLayout>
    );
  }

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Not Found" collectionSlug={slug || ""}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
        </div>
      </CollectionLayout>
    );
  }

  // Get matching topic count for current filter
  const getMatchingTopicCount = () => {
    if (currentFilter === 'all') return 0;
    return categories[currentFilter as keyof typeof categories]?.topics.length || 0;
  };

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="space-y-6">
        {/* Back button for topic/filtered view */}
        {currentView !== 'hub' && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
            style={{ color: 'hsl(var(--scheme-nav-bg))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all topics
          </Button>
        )}

        {/* Intro Section - only show on hub */}
        {currentView === 'hub' && (
          <div className="text-center py-8 max-w-2xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'hsl(var(--scheme-nav-bg))' }}
            >
              Help us build something that matters
            </h2>
            <p className="text-muted-foreground text-lg">
              A proven exercise that gives people permission to share the stories
              that define them. Real relationships require real sharing—this makes it possible.
            </p>
          </div>
        )}

        {/* Filter Chips - only show on hub view - monochrome with icons */}
        {currentView === 'hub' && (
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              className={`px-4 py-2 text-sm rounded-full border transition-all flex items-center gap-2 ${
                currentFilter === 'all'
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFilterClick('all')}
            >
              All ({getTotalCardCount()})
            </button>
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                className={`px-4 py-2 text-sm rounded-full border transition-all flex items-center gap-2 ${
                  currentFilter === key
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleFilterClick(key)}
              >
                <CategoryIcon category={key} className="w-4 h-4" />
                {cat.name} ({getCardCountByCategory(key)})
              </button>
            ))}
          </div>
        )}

        {/* Consolidated Banner - only show when filtered and on hub view - monochrome */}
        {currentFilter !== 'all' && currentView === 'hub' && (
          <div className="rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 border-l-4 border-gray-400">
            <div>
              <p className="text-gray-800">
                <strong>{getMatchingTopicCount()} topics</strong> contain {categories[currentFilter as keyof typeof categories]?.name} content
              </p>
              <p className="text-sm text-gray-500">
                {categories[currentFilter as keyof typeof categories]?.desc}
              </p>
            </div>
            <Button
              onClick={handleViewFiltered}
              className="bg-gray-700 text-white hover:bg-gray-800"
            >
              View all combined →
            </Button>
          </div>
        )}

        {/* Hub View - Books Grid - 3D stacked-pages effect */}
        {currentView === 'hub' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {bookMeta.map((book) => {
              const isMatching = currentFilter === 'all' || book.category === currentFilter;
              const topic = topics[book.num];
              const bookImage = bookImageMap[book.num];

              return (
                <div
                  key={book.num}
                  onClick={() => handleBookClick(book.num)}
                  className={`
                    cursor-pointer transition-all duration-300
                    hover:-translate-y-2 relative ml-2 mt-2
                    ${!isMatching ? 'opacity-30' : ''}
                  `}
                >
                  {/* Stacked pages effect - back layers */}
                  <div 
                    className="absolute inset-0 rounded-sm bg-[#d4d4d4]"
                    style={{ 
                      transform: 'translate(-8px, 8px)',
                      zIndex: 0 
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-sm bg-[#e5e5e5]"
                    style={{ 
                      transform: 'translate(-4px, 4px)',
                      zIndex: 1 
                    }}
                  />
                  
                  {/* Main card face - V4 Layout: Title → Image → Footer */}
                  <div 
                    className="relative rounded-sm shadow-lg flex flex-col border border-gray-200"
                    style={{ 
                      backgroundColor: '#fafaf9',
                      aspectRatio: '2/3',
                      zIndex: 2 
                    }}
                  >
                    {/* Title Area - flexible whitespace, title at bottom */}
                    <div 
                      className="flex items-end justify-center text-center px-3 pt-3 pb-2"
                      style={{ minHeight: '48px', flexShrink: 0 }}
                    >
                      <h3 
                        className="font-bold text-sm md:text-base leading-tight text-gray-800"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {book.title}
                      </h3>
                    </div>
                    
                    {/* Image Area - FIXED 45% height */}
                    <div 
                      className="mx-3 rounded overflow-hidden relative group"
                      style={{ 
                        height: '45%', 
                        flexShrink: 0, 
                        flexGrow: 0 
                      }}
                    >
                      {bookImage ? (
                        <img 
                          src={bookImage} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ 
                            background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)' 
                          }}
                        >
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      
                      {/* Admin upload overlay */}
                      {isAdmin && (
                        <>
                          <div 
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRefs.current[book.num]?.click();
                            }}
                          >
                            {uploadingBook === book.num ? (
                              <span className="text-white text-xs">Uploading...</span>
                            ) : (
                              <div className="flex flex-col items-center text-white">
                                <Upload className="w-5 h-5 mb-1" />
                                <span className="text-xs">Upload</span>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => { fileInputRefs.current[book.num] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(book.num, file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </>
                      )}
                    </div>
                    
                    {/* Footer Area - tagline + section count */}
                    <div className="flex-1 flex flex-col justify-start items-center text-center px-3 py-2">
                      <p className="text-gray-400 text-[10px] italic line-clamp-2">
                        {book.tagline}
                      </p>
                      <p className="text-gray-300 text-[9px] mt-1">
                        {topic?.cards.length || 0} sections
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Topic View */}
        {currentView === 'topic' && currentTopic && (
          <TopicView
            topicNum={currentTopic}
            topic={topics[currentTopic]}
            bookImageMap={bookImageMap}
            onMobileCardClick={handleMobileCardClick}
            cards={filteredCards}
          />
        )}

        {/* Filtered View */}
        {currentView === 'filtered' && (
          <FilteredView
            categoryKey={currentFilter}
            cards={filteredCards}
            onMobileCardClick={handleMobileCardClick}
          />
        )}

        {/* Modal - only used for mobile */}
        {modalOpen && filteredCards.length > 0 && (
          <CardModal
            cards={filteredCards}
            currentIndex={currentCardIndex}
            onClose={handleModalClose}
            onPrev={handleModalPrev}
            onNext={handleModalNext}
          />
        )}
      </div>
    </CollectionLayout>
  );
}

// Consistent accent color for pitch views (product blue)
const PITCH_ACCENT_COLOR = '#1d4ed8';

// Topic View Component
interface TopicViewProps {
  topicNum: number;
  topic: Topic;
  bookImageMap: Record<number, string>;
  onMobileCardClick: (index: number) => void;
  cards: FilteredCard[];
}

function TopicView({ topicNum, topic, bookImageMap, onMobileCardClick, cards }: TopicViewProps) {
  const bookImage = bookImageMap[topicNum];
  const book = bookMeta.find(b => b.num === topicNum);

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Main content */}
      <div className="md:col-span-2 space-y-6">
        {/* Topic header */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Topic {topicNum} of 12</p>
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: 'hsl(var(--scheme-title-text))' }}
          >
            {topic.title}
          </h2>
          <p className="text-lg text-muted-foreground">{topic.desc}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {topic.cards.length} sections
          </p>
        </div>

        {/* Mobile: horizontal scroll with compact cards (click to expand in modal) */}
        <div className="md:hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {cards.map((card, index) => (
                <MobileCard
                  key={index}
                  card={card}
                  index={index}
                  onClick={() => onMobileCardClick(index)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Desktop: fully expanded cards - just scroll to read */}
        <div className="hidden md:flex flex-col gap-6">
          {cards.map((card, index) => (
            <ExpandedCard
              key={index}
              card={card}
              index={index}
              topicTitle={topic.title}
              totalCards={cards.length}
            />
          ))}
        </div>
      </div>

      {/* Sidebar - desktop only - matches V4 book card style */}
      <div className="hidden md:block">
        <div className="sticky top-24">
          <p className="text-sm text-muted-foreground mb-3">Source</p>
          
          {/* Book card style sidebar */}
          <div 
            className="rounded-sm shadow-lg flex flex-col border border-gray-200"
            style={{ 
              backgroundColor: '#fafaf9',
              aspectRatio: '2/3',
              maxWidth: '280px'
            }}
          >
            {/* Title Area - flexible whitespace, title at bottom */}
            <div 
              className="flex items-end justify-center text-center px-4 pt-4 pb-3"
              style={{ minHeight: '56px', flexShrink: 0 }}
            >
              <h3 
                className="font-bold text-lg leading-tight text-gray-800"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {topic.title}
              </h3>
            </div>
            
            {/* Image Area - FIXED 45% height */}
            <div 
              className="mx-4 rounded overflow-hidden"
              style={{ 
                height: '45%', 
                flexShrink: 0, 
                flexGrow: 0 
              }}
            >
              {bookImage ? (
                <img 
                  src={bookImage} 
                  alt={topic.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)' 
                  }}
                >
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
            </div>
            
            {/* Footer Area - tagline + section count */}
            <div className="flex-1 flex flex-col justify-start items-center text-center px-4 py-3">
              <p className="text-gray-500 text-xs italic line-clamp-2">
                {book?.tagline}
              </p>
              <p className="text-gray-400 text-[10px] mt-1">
                {topic.cards.length} sections
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Expanded Card Component - for desktop view (full content, no click needed)
interface ExpandedCardProps {
  card: FilteredCard;
  index: number;
  topicTitle: string;
  totalCards: number;
}

function ExpandedCard({ card, index, topicTitle, totalCards }: ExpandedCardProps) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: 'hsl(var(--scheme-card-bg))',
        borderLeft: `4px solid #e5e5e5`
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
          style={{ backgroundColor: PITCH_ACCENT_COLOR }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <h3
            className="font-bold text-xl mb-1"
            style={{ color: 'hsl(var(--scheme-title-text))' }}
          >
            {card.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Section {index + 1} of {totalCards} • {topicTitle}
          </p>
        </div>
      </div>

      {/* Full content - rendered as HTML */}
      <div
        className="prose prose-lg max-w-none"
        style={{ color: 'hsl(var(--scheme-dark-text))' }}
        dangerouslySetInnerHTML={{ __html: card.content }}
      />
    </div>
  );
}

// Mobile Card Component - compact, click to open modal
interface MobileCardProps {
  card: FilteredCard;
  index: number;
  onClick: () => void;
}

function MobileCard({ card, index, onClick }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className="min-w-[280px] w-[280px] rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: 'hsl(var(--scheme-card-bg))',
        borderLeft: `4px solid #e5e5e5`
      }}
    >
      <h3
        className="font-semibold mb-2"
        style={{ color: 'hsl(var(--scheme-title-text))' }}
      >
        {card.title}
      </h3>
      <p
        className="text-sm line-clamp-3 mb-3"
        style={{ color: 'hsl(var(--scheme-cards-text))' }}
      >
        {card.preview}
      </p>
      <p
        className="text-sm font-medium"
        style={{ color: PITCH_ACCENT_COLOR }}
      >
        Tap to read →
      </p>
    </div>
  );
}

// Filtered View Component
interface FilteredViewProps {
  categoryKey: string;
  cards: FilteredCard[];
  onMobileCardClick: (index: number) => void;
}

function FilteredView({ categoryKey, cards, onMobileCardClick }: FilteredViewProps) {
  const category = categories[categoryKey as keyof typeof categories];

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'hsl(var(--scheme-title-text))' }}
        >
          {category?.name}
        </h2>
        <p className="text-lg text-muted-foreground">{category?.desc}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {cards.length} sections from {category?.topics.length} topics
        </p>
      </div>

      {/* Mobile: horizontal scroll with compact cards */}
      <div className="md:hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {cards.map((card, index) => (
              <MobileCard
                key={`${card.topicNum}-${index}`}
                card={card}
                index={index}
                onClick={() => onMobileCardClick(index)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Desktop: fully expanded cards */}
      <div className="hidden md:flex flex-col gap-6">
        {cards.map((card, index) => (
          <ExpandedCard
            key={`${card.topicNum}-${index}`}
            card={card}
            index={index}
            topicTitle={card.topicTitle}
            totalCards={cards.length}
          />
        ))}
      </div>
    </div>
  );
}

// Modal Component - only for mobile
interface CardModalProps {
  cards: FilteredCard[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function CardModal({ cards, currentIndex, onClose, onPrev, onNext }: CardModalProps) {
  const card = cards[currentIndex];
  const topic = topics[card.topicNum];

  // Handle swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < cards.length - 1) {
      onNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      onPrev();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          disabled={currentIndex === 0}
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          disabled={currentIndex === cards.length - 1}
          className="text-white hover:bg-white/10"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Content */}
      <div
        className="bg-white rounded-xl max-w-[700px] w-full max-h-[80vh] overflow-y-auto p-6 md:p-8"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <h2
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ color: PITCH_ACCENT_COLOR }}
        >
          {card.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Section {currentIndex + 1} of {cards.length} • {topic?.title}
        </p>

        <div
          className="prose prose-lg max-w-none"
          style={{ color: 'hsl(var(--scheme-dark-text))' }}
          dangerouslySetInnerHTML={{ __html: card.content }}
        />
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
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

// Book cover gradient styles
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

        {/* Filter Chips - only show on hub view */}
        {currentView === 'hub' && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant={currentFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm transition-all"
              style={currentFilter === 'all' ? {
                backgroundColor: 'hsl(var(--scheme-nav-bg))',
                color: 'hsl(var(--scheme-nav-text))',
                borderColor: 'hsl(var(--scheme-nav-bg))'
              } : {
                backgroundColor: 'white',
                color: 'hsl(var(--scheme-nav-bg))',
                borderColor: 'hsl(var(--scheme-nav-bg))'
              }}
              onClick={() => handleFilterClick('all')}
            >
              All ({getTotalCardCount()})
            </Badge>
            {Object.entries(categories).map(([key, cat]) => (
              <Badge
                key={key}
                variant={currentFilter === key ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm transition-all"
                style={currentFilter === key ? {
                  backgroundColor: 'hsl(var(--scheme-nav-bg))',
                  color: 'hsl(var(--scheme-nav-text))',
                  borderColor: 'hsl(var(--scheme-nav-bg))'
                } : {
                  backgroundColor: 'white',
                  color: 'hsl(var(--scheme-nav-bg))',
                  borderColor: 'hsl(var(--scheme-nav-bg))'
                }}
                onClick={() => handleFilterClick(key)}
              >
                {cat.name} ({getCardCountByCategory(key)})
              </Badge>
            ))}
          </div>
        )}

        {/* Consolidated Banner - only show when filtered and on hub view */}
        {currentFilter !== 'all' && currentView === 'hub' && (
          <div
            className="rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: 'hsl(var(--scheme-card-bg))',
              borderLeft: '4px solid hsl(var(--scheme-nav-bg))'
            }}
          >
            <div>
              <p style={{ color: 'hsl(var(--scheme-cards-text))' }}>
                <strong>{getMatchingTopicCount()} topics</strong> contain {categories[currentFilter as keyof typeof categories]?.name} content
              </p>
              <p className="text-sm text-muted-foreground">
                {categories[currentFilter as keyof typeof categories]?.desc}
              </p>
            </div>
            <Button
              onClick={handleViewFiltered}
              style={{
                backgroundColor: 'hsl(var(--scheme-nav-button))',
                color: 'hsl(var(--scheme-dark-text))'
              }}
            >
              View all combined →
            </Button>
          </div>
        )}

        {/* Hub View - Books Grid */}
        {currentView === 'hub' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {bookMeta.map((book) => {
              const isMatching = currentFilter === 'all' || book.category === currentFilter;
              const topic = topics[book.num];

              return (
                <div
                  key={book.num}
                  onClick={() => handleBookClick(book.num)}
                  className={`
                    relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300
                    hover:shadow-xl hover:-translate-y-1
                    ${!isMatching ? 'opacity-30' : ''}
                  `}
                  style={{
                    background: bookGradients[book.color],
                    aspectRatio: '3/4'
                  }}
                >
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white font-bold text-xl leading-tight mb-1">
                      {book.title}
                    </h3>
                    <p className="text-white/80 text-sm italic line-clamp-2">
                      {book.tagline}
                    </p>
                    <p className="text-white/60 text-xs mt-2">
                      {topic?.cards.length || 0} sections
                    </p>
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
            bookColor={bookMeta.find(b => b.num === currentTopic)?.color || 'c1'}
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

// Topic View Component
interface TopicViewProps {
  topicNum: number;
  topic: Topic;
  bookColor: string;
  onMobileCardClick: (index: number) => void;
  cards: FilteredCard[];
}

function TopicView({ topicNum, topic, bookColor, onMobileCardClick, cards }: TopicViewProps) {
  const gradient = bookGradients[bookColor];
  const primaryColor = gradient.match(/#[a-f0-9]{6}/i)?.[0] || '#2d5a4a';

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
                  bookColor={bookColor}
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
              primaryColor={primaryColor}
              topicTitle={topic.title}
              totalCards={cards.length}
            />
          ))}
        </div>
      </div>

      {/* Sidebar - desktop only */}
      <div className="hidden md:block">
        <div className="sticky top-24">
          <p className="text-sm text-muted-foreground mb-3">Source</p>
          <div
            className="rounded-lg p-6 text-white"
            style={{ background: bookGradients[bookColor] }}
          >
            <div className="text-5xl font-bold opacity-50 mb-4">
              {topicNum.toString().padStart(2, '0')}
            </div>
            <h3 className="font-bold text-xl">{topic.title}</h3>
            <p className="text-sm opacity-80 italic mt-2">
              {bookMeta.find(b => b.num === topicNum)?.tagline}
            </p>
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
  primaryColor: string;
  topicTitle: string;
  totalCards: number;
}

function ExpandedCard({ card, index, primaryColor, topicTitle, totalCards }: ExpandedCardProps) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: 'hsl(var(--scheme-card-bg))',
        borderLeft: `4px solid ${primaryColor}`
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3
              className="font-bold text-xl"
              style={{ color: 'hsl(var(--scheme-title-text))' }}
            >
              {card.title}
            </h3>
            <Badge
              variant="secondary"
              className="text-xs shrink-0 ml-2"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor
              }}
            >
              {topics[card.topicNum]?.category}
            </Badge>
          </div>
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
  bookColor: string;
  onClick: () => void;
}

function MobileCard({ card, index, bookColor, onClick }: MobileCardProps) {
  const gradient = bookGradients[bookColor];
  const primaryColor = gradient.match(/#[a-f0-9]{6}/i)?.[0] || '#2d5a4a';

  return (
    <div
      onClick={onClick}
      className="min-w-[280px] w-[280px] rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: 'hsl(var(--scheme-card-bg))',
        borderLeft: `4px solid ${primaryColor}`
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3
          className="font-semibold"
          style={{ color: 'hsl(var(--scheme-title-text))' }}
        >
          {card.title}
        </h3>
        <Badge
          variant="secondary"
          className="text-xs shrink-0"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor
          }}
        >
          {topics[card.topicNum]?.category}
        </Badge>
      </div>
      <p
        className="text-sm line-clamp-3 mb-3"
        style={{ color: 'hsl(var(--scheme-cards-text))' }}
      >
        {card.preview}
      </p>
      <p
        className="text-sm font-medium"
        style={{ color: 'hsl(var(--scheme-nav-bg))' }}
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
            {cards.map((card, index) => {
              const book = bookMeta.find(b => b.num === card.topicNum);
              return (
                <MobileCard
                  key={`${card.topicNum}-${index}`}
                  card={card}
                  index={index}
                  bookColor={book?.color || 'c1'}
                  onClick={() => onMobileCardClick(index)}
                />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Desktop: fully expanded cards */}
      <div className="hidden md:flex flex-col gap-6">
        {cards.map((card, index) => {
          const book = bookMeta.find(b => b.num === card.topicNum);
          const gradient = bookGradients[book?.color || 'c1'];
          const primaryColor = gradient.match(/#[a-f0-9]{6}/i)?.[0] || '#2d5a4a';

          return (
            <ExpandedCard
              key={`${card.topicNum}-${index}`}
              card={card}
              index={index}
              primaryColor={primaryColor}
              topicTitle={card.topicTitle}
              totalCards={cards.length}
            />
          );
        })}
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
          style={{ color: 'hsl(var(--scheme-nav-bg))' }}
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

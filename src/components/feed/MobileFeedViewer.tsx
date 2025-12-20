import { useState, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Loader2, Rss, Menu, Home, Users, Award, FolderOpen, MoreHorizontal, ArrowUp, Settings } from 'lucide-react';
import { MobileFeedGraph, MobileFeedGraphRef } from './MobileFeedGraph';
import { MobileFeedDetailSheet } from './MobileFeedDetailSheet';
import { MobileFeedSettingsSheet } from './MobileFeedSettingsSheet';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LifelineBookIcon } from '@/components/icons/LifelineBookIcon';
import { cn } from '@/lib/utils';

interface MobileFeedViewerProps {
  entries: FeedEntry[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  seenIds: Set<string>;
  seenFilter: 'unseen' | 'seen' | 'all';
  onToggleSeen: (entryId: string) => void;
  existingSubscriptions?: string[];
  showSettingsOnMount?: boolean;
}

export const MobileFeedViewer = ({
  entries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  seenIds,
  seenFilter,
  onToggleSeen,
  existingSubscriptions = [],
  showSettingsOnMount = false,
}: MobileFeedViewerProps) => {
  const location = useLocation();
  const graphRef = useRef<MobileFeedGraphRef>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(showSettingsOnMount);
  const [currentYear, setCurrentYear] = useState<number>(entries[0]?.date.getFullYear() || new Date().getFullYear());

  // Filter entries based on seen status
  const filteredEntries = useMemo(() => {
    if (seenFilter === 'all') return entries;
    if (seenFilter === 'seen') return entries.filter(e => seenIds.has(e.id));
    return entries.filter(e => !seenIds.has(e.id)); // unseen
  }, [entries, seenIds, seenFilter]);

  const handleEntryClick = (entry: FeedEntry, index: number) => {
    setSelectedIndex(index);
    setIsDetailOpen(true);
  };

  const handleClose = () => {
    setIsDetailOpen(false);
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < filteredEntries.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleScrollToTop = () => {
    graphRef.current?.scrollToTop();
  };

  const selectedEntry = selectedIndex !== null ? filteredEntries[selectedIndex] : null;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/public/collections", label: "Collections", icon: FolderOpen },
    { path: "/public/lifelines", label: "Stories", icon: LifelineBookIcon },
    { path: "/public/profiles", label: "Profiles", icon: Users },
    { path: "/public/elections", label: "Awards", icon: Award },
    { path: "/public/more", label: "More", icon: MoreHorizontal },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button))]",
              isActive && "bg-[hsl(var(--scheme-nav-button))] font-bold"
            )}
          >
            <Link to={item.path} onClick={onClick}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show empty state but still allow settings access
  const showEmptyState = filteredEntries.length === 0;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Custom Feed Header */}
      <header className="sticky top-0 z-50 bg-[hsl(var(--scheme-nav-bg))] border-b border-[hsl(var(--scheme-nav-bg)/.8)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[hsl(var(--scheme-nav-text))]">
            <span className="font-bold">Feed</span>
            <Rss className="h-4 w-4" />
          </div>
          
          <span className="font-bold text-[hsl(var(--scheme-nav-text))]">{currentYear}</span>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-[hsl(var(--scheme-nav-bg))]">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold mt-2 text-[hsl(var(--scheme-nav-text))]">Lifeline Public</h2>
                <div className="flex flex-col gap-2">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {showEmptyState ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No entries found</h3>
          <p className="text-muted-foreground mb-4">
            {seenFilter === 'seen' 
              ? "You haven't marked any entries as seen yet."
              : seenFilter === 'unseen'
              ? "You've seen all entries! Check back later for new content."
              : existingSubscriptions.length === 0
              ? "Tap the settings button below to add lifelines to your feed."
              : "The lifelines you selected don't have any dated events yet."}
          </p>
          <Button onClick={() => setShowSettings(true)}>
            Adjust Feed Settings
          </Button>
        </div>
      ) : (
        <MobileFeedGraph
          ref={graphRef}
          entries={filteredEntries}
          selectedId={selectedEntry?.id || null}
          onEntryClick={handleEntryClick}
          onLoadMore={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          currentYear={currentYear}
          onYearChange={setCurrentYear}
        />
      )}

      {/* Floating Action Buttons - always visible */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleScrollToTop}
          className="rounded-full shadow-lg h-10 w-10 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.9)]"
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setShowSettings(true)}
          className="rounded-full shadow-lg h-10 w-10 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.9)]"
        >
          <Settings className="h-5 w-5 text-white" />
        </Button>
      </div>

      <MobileFeedDetailSheet
        entry={selectedEntry}
        isOpen={isDetailOpen}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={selectedIndex !== null && selectedIndex > 0}
        canGoNext={selectedIndex !== null && selectedIndex < filteredEntries.length - 1}
        currentIndex={selectedIndex || 0}
        totalEntries={filteredEntries.length}
      />

      <MobileFeedSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        existingSubscriptions={existingSubscriptions}
      />
    </div>
  );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFeedData, useCollectionSubscriptions } from '@/hooks/useFeedData';
import { useSeenEntries, useMarkSeen, useUnmarkSeen } from '@/hooks/useFeedSeen';
import { FeedViewer } from '@/components/feed/FeedViewer';
import { MobileFeedViewer } from '@/components/feed/MobileFeedViewer';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [seenFilter, setSeenFilter] = useState<'unseen' | 'seen' | 'all'>('unseen');

  const { data: subscribedCollections = [], isLoading: subsLoading } = useCollectionSubscriptions(user?.id);

  const feedQuery = useFeedData(user?.id);
  const allEntries = feedQuery.data?.pages?.flatMap(page => page.entries) || [];

  const { data: seenIds = new Set<string>() } = useSeenEntries(user?.id);
  const markSeen = useMarkSeen(user?.id);
  const unmarkSeen = useUnmarkSeen(user?.id);

  const handleToggleSeen = (entryId: string) => {
    if (!user) return;
    if (seenIds.has(entryId)) {
      unmarkSeen.mutate(entryId);
    } else {
      markSeen.mutate(entryId);
    }
  };

  const isLoading = (user && subsLoading) || feedQuery.isLoading;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileFeedViewer
        entries={allEntries}
        isLoading={feedQuery.isLoading}
        hasNextPage={feedQuery.hasNextPage || false}
        isFetchingNextPage={feedQuery.isFetchingNextPage}
        fetchNextPage={feedQuery.fetchNextPage}
        seenIds={seenIds}
        seenFilter={seenFilter}
        onToggleSeen={handleToggleSeen}
        existingSubscriptions={subscribedCollections}
        showSettingsOnMount={user ? subscribedCollections.length === 0 : false}
      />
    );
  }

  const getSubtitle = () => {
    if (user && subscribedCollections.length > 0) {
      return `Events from ${subscribedCollections.length} collection${subscribedCollections.length !== 1 ? 's' : ''}`;
    }
    if (user) {
      return 'Subscribe to collections to see their events here';
    }
    return 'Discover collections';
  };

  return (
    <PublicLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{user ? 'My Feed' : 'Feed'}</h1>
          <p className="text-muted-foreground">{getSubtitle()}</p>
        </div>
        {user ? (
          <Button variant="outline" onClick={() => navigate('/feed/setup')}>
            Adjust Feed
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Sign In to Customize
          </Button>
        )}
      </div>

      {user && subscribedCollections.length === 0 && allEntries.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Subscribe to collections to see their events in your feed.{' '}
            <button
              onClick={() => navigate('/feed/setup')}
              className="text-primary underline hover:no-underline"
            >
              Set up your feed
            </button>
          </p>
        </div>
      )}

      {/* Filter Bar - only for authenticated users with subscriptions */}
      {user && subscribedCollections.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={seenFilter === 'unseen' ? 'default' : 'outline'}
            onClick={() => setSeenFilter('unseen')}
            size="sm"
          >
            Unseen
          </Button>
          <Button
            variant={seenFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSeenFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={seenFilter === 'seen' ? 'default' : 'outline'}
            onClick={() => setSeenFilter('seen')}
            size="sm"
          >
            Seen
          </Button>
        </div>
      )}

      <FeedViewer
        entries={allEntries}
        isLoading={feedQuery.isLoading}
        hasNextPage={feedQuery.hasNextPage || false}
        isFetchingNextPage={feedQuery.isFetchingNextPage}
        fetchNextPage={feedQuery.fetchNextPage}
        seenIds={seenIds}
        seenFilter={user ? seenFilter : 'all'}
        onToggleSeen={handleToggleSeen}
      />
    </PublicLayout>
  );
}

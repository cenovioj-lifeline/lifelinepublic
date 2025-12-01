import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFeedData, useFeedSubscriptions } from '@/hooks/useFeedData';
import { useSeenEntries, useMarkSeen, useUnmarkSeen } from '@/hooks/useFeedSeen';
import { FeedViewer } from '@/components/feed/FeedViewer';
import { MobileFeedViewer } from '@/components/feed/MobileFeedViewer';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [seenFilter, setSeenFilter] = useState<'unseen' | 'seen' | 'all'>('unseen');

  // Check if user has subscriptions (only relevant for authenticated users)
  const { data: subscriptions = [], isLoading: subsLoading } = useFeedSubscriptions(user?.id);

  // On desktop, redirect authenticated users with no subscriptions to setup
  useEffect(() => {
    if (!isMobile && !subsLoading && user && subscriptions.length === 0) {
      navigate('/feed/setup');
    }
  }, [subscriptions, subsLoading, user, navigate, isMobile]);

  // Fetch feed data - works for both authenticated and anonymous users
  const feedQuery = useFeedData(user?.id);

  const allEntries = feedQuery.data?.pages?.flatMap(page => page.entries) || [];

  // Seen entries management (only for authenticated users)
  const { data: seenIds = new Set<string>() } = useSeenEntries(user?.id);
  const markSeen = useMarkSeen(user?.id);
  const unmarkSeen = useUnmarkSeen(user?.id);

  const handleToggleSeen = (entryId: string) => {
    if (!user) return; // Can't toggle seen for anonymous users
    if (seenIds.has(entryId)) {
      unmarkSeen.mutate(entryId);
    } else {
      markSeen.mutate(entryId);
    }
  };

  // Show loading state
  const isLoading = (user && subsLoading) || feedQuery.isLoading;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // On desktop with authenticated user with no subscriptions, will redirect (handled in useEffect)
  if (!isMobile && user && subscriptions.length === 0) {
    return null;
  }

  // Mobile view - show feed with settings sheet option
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
        existingSubscriptions={subscriptions}
        showSettingsOnMount={user ? subscriptions.length === 0 : false}
      />
    );
  }

  if (allEntries.length === 0) {
    return (
      <PublicLayout>
        <Card className="p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Your Feed is Empty</h2>
          <p className="text-muted-foreground mb-6">
            {user 
              ? "The lifelines you selected don't have any dated events yet. Try adding more lifelines to your feed."
              : "Sign in to customize your feed with your favorite lifelines."
            }
          </p>
          {user ? (
            <Button onClick={() => navigate('/feed/setup')}>
              Adjust Feed Settings
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </Card>
      </PublicLayout>
    );
  }

  // Determine subtitle based on auth state
  const getSubtitle = () => {
    if (user && subscriptions.length > 0) {
      return `Events from ${subscriptions.length} lifeline${subscriptions.length !== 1 ? 's' : ''}`;
    }
    return 'News and recent collections';
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
      
      {/* Filter Bar - only show for authenticated users */}
      {user && (
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

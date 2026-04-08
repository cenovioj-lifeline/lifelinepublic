import { Rss, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollectionSubscription } from '@/hooks/useCollectionSubscription';
import { toast } from 'sonner';
import { useState } from 'react';
import { PublicAuthModal } from '@/components/PublicAuthModal';

interface CollectionFeedButtonProps {
  collectionId: string;
  className?: string;
}

export const CollectionFeedButton = ({ collectionId, className }: CollectionFeedButtonProps) => {
  const { isSubscribed, isLoading, isAuthenticated, subscribe, unsubscribe, isPending } = useCollectionSubscription(collectionId);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (isSubscribed) {
      if (confirm('Remove this collection from your feed?')) {
        unsubscribe(undefined, {
          onSuccess: () => toast.success('Removed from your feed'),
          onError: () => toast.error('Failed to update feed'),
        });
      }
    } else {
      subscribe(undefined, {
        onSuccess: () => toast.success('Added to your feed!'),
        onError: () => toast.error('Failed to update feed'),
      });
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={isSubscribed ? 'default' : 'outline-solid'}
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={className}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : isSubscribed ? (
          <Check className="h-4 w-4 mr-1" />
        ) : (
          <Rss className="h-4 w-4 mr-1" />
        )}
        {isSubscribed ? 'In Your Feed' : 'Add to Feed'}
      </Button>
      <PublicAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

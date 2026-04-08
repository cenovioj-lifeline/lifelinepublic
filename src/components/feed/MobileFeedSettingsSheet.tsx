import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Loader2, X, Check, Rss } from 'lucide-react';
import { toast } from 'sonner';

interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  card_image_url: string | null;
}

interface MobileFeedSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  existingSubscriptions: string[];
}

export const MobileFeedSettingsSheet = ({
  isOpen,
  onClose,
  existingSubscriptions,
}: MobileFeedSettingsSheetProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

  // Initialize from existing subscriptions
  useEffect(() => {
    if (existingSubscriptions.length > 0) {
      setSelectedCollections(new Set(existingSubscriptions));
    }
  }, [existingSubscriptions]);

  // Fetch published collections
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections-for-feed-setup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, title, slug, description, hero_image_url, card_image_url')
        .eq('status', 'published')
        .order('title');

      if (error) throw error;
      return (data || []) as CollectionItem[];
    },
    enabled: !!user && isOpen,
  });

  // Filter by search
  const filteredCollections = collections.filter(col =>
    col.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (col.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      await supabase
        .from('user_collection_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (selectedCollections.size > 0) {
        const subscriptions = Array.from(selectedCollections).map(collectionId => ({
          user_id: user.id,
          collection_id: collectionId,
        }));

        const { error } = await supabase
          .from('user_collection_subscriptions')
          .insert(subscriptions);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['collection-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      toast.success('Feed settings saved!');
      onClose();
    },
    onError: (error) => {
      console.error('Error saving feed settings:', error);
      toast.error('Failed to save feed settings');
    },
  });

  const toggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Adjust Your Feed</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Select collections to follow. Their events will appear in your feed.
          </p>
          <p className="text-xs text-muted-foreground text-left">
            {selectedCollections.size} collection{selectedCollections.size !== 1 ? 's' : ''} selected
          </p>
        </SheetHeader>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCollections.map((col) => {
                const isSelected = selectedCollections.has(col.id);
                const imageUrl = col.card_image_url || col.hero_image_url;

                return (
                  <div
                    key={col.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => toggleCollection(col.id)}
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-12 w-16 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{col.title}</p>
                      {col.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{col.description}</p>
                      )}
                    </div>
                    {isSelected ? (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Rss className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}

              {filteredCollections.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No collections found.' : 'No collections available.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex-1"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

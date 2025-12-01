import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface LifelineWithCollection {
  id: string;
  title: string;
  collection_id: string | null;
  collection_title: string;
  dated_entries: number;
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
  const [selectedLifelines, setSelectedLifelines] = useState<Set<string>>(new Set());

  // Initialize selected lifelines from existing subscriptions
  useEffect(() => {
    if (existingSubscriptions.length > 0) {
      setSelectedLifelines(new Set(existingSubscriptions));
    }
  }, [existingSubscriptions]);

  // Fetch lifelines with dated entries
  const { data: lifelines = [], isLoading } = useQuery({
    queryKey: ['lifelines-with-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifelines')
        .select(`
          id,
          title,
          collection_id,
          collections (
            title
          ),
          entries!inner (
            occurred_on
          )
        `)
        .eq('status', 'published')
        .not('entries.occurred_on', 'is', null);

      if (error) throw error;

      const lifelineMap = new Map<string, LifelineWithCollection>();
      
      data.forEach(item => {
        if (!lifelineMap.has(item.id)) {
          const collection = Array.isArray(item.collections) ? item.collections[0] : item.collections;
          const entriesArray = Array.isArray(item.entries) ? item.entries : [];
          
          lifelineMap.set(item.id, {
            id: item.id,
            title: item.title,
            collection_id: item.collection_id || 'standalone',
            collection_title: collection?.title || 'Standalone Lifelines',
            dated_entries: entriesArray.length > 0 ? entriesArray.length : 1,
          });
        } else {
          lifelineMap.get(item.id)!.dated_entries++;
        }
      });

      return Array.from(lifelineMap.values());
    },
    enabled: !!user && isOpen,
  });

  // Group lifelines by collection
  const lifelinesByCollection = lifelines.reduce((acc, lifeline) => {
    const collectionId = lifeline.collection_id;
    if (!acc[collectionId]) {
      acc[collectionId] = {
        title: lifeline.collection_title,
        lifelines: [],
      };
    }
    acc[collectionId].lifelines.push(lifeline);
    return acc;
  }, {} as Record<string, { title: string; lifelines: LifelineWithCollection[] }>);

  // Filter lifelines by search term
  const filteredCollections = Object.entries(lifelinesByCollection).reduce((acc, [collectionId, data]) => {
    const filteredLifelines = data.lifelines.filter(lifeline =>
      lifeline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredLifelines.length > 0) {
      acc[collectionId] = { ...data, lifelines: filteredLifelines };
    }
    return acc;
  }, {} as typeof lifelinesByCollection);

  // Save subscriptions mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      await supabase
        .from('user_feed_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (selectedLifelines.size > 0) {
        const subscriptions = Array.from(selectedLifelines).map(lifelineId => ({
          user_id: user.id,
          lifeline_id: lifelineId,
        }));

        const { error } = await supabase
          .from('user_feed_subscriptions')
          .insert(subscriptions);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      toast.success('Feed settings saved!');
      onClose();
    },
    onError: (error) => {
      console.error('Error saving feed settings:', error);
      toast.error('Failed to save feed settings');
    },
  });

  const toggleLifeline = (lifelineId: string) => {
    const newSelected = new Set(selectedLifelines);
    if (newSelected.has(lifelineId)) {
      newSelected.delete(lifelineId);
    } else {
      newSelected.add(lifelineId);
    }
    setSelectedLifelines(newSelected);
  };

  const toggleCollection = (collectionLifelines: LifelineWithCollection[]) => {
    const lifelineIds = collectionLifelines.map(l => l.id);
    const allSelected = lifelineIds.every(id => selectedLifelines.has(id));
    
    const newSelected = new Set(selectedLifelines);
    if (allSelected) {
      lifelineIds.forEach(id => newSelected.delete(id));
    } else {
      lifelineIds.forEach(id => newSelected.add(id));
    }
    setSelectedLifelines(newSelected);
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
            Select lifelines to follow. Without selections, you'll still see new collections.
          </p>
          <p className="text-xs text-muted-foreground text-left">
            {selectedLifelines.size} lifeline{selectedLifelines.size !== 1 ? 's' : ''} selected
          </p>
        </SheetHeader>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lifelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lifelines list */}
        <div className="flex-1 overflow-y-auto pb-20" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(filteredCollections).map(([collectionId, { title, lifelines: collectionLifelines }]) => {
                const allSelected = collectionLifelines.every(l => selectedLifelines.has(l.id));
                const someSelected = collectionLifelines.some(l => selectedLifelines.has(l.id));

                return (
                  <Collapsible key={collectionId}>
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleCollection(collectionLifelines)}
                              onClick={(e) => e.stopPropagation()}
                              className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                            />
                            <div className="text-left">
                              <h3 className="font-medium text-sm">{title}</h3>
                              <p className="text-xs text-muted-foreground">
                                {collectionLifelines.length} lifeline{collectionLifelines.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t">
                          {collectionLifelines.map((lifeline) => (
                            <div
                              key={lifeline.id}
                              className="flex items-center gap-3 p-3 pl-10 hover:bg-accent/30 transition-colors cursor-pointer"
                              onClick={() => toggleLifeline(lifeline.id)}
                            >
                              <Checkbox
                                checked={selectedLifelines.has(lifeline.id)}
                                onCheckedChange={() => toggleLifeline(lifeline.id)}
                              />
                              <div className="flex-1">
                                <p className="text-sm">{lifeline.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lifeline.dated_entries} event{lifeline.dated_entries !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}

              {Object.keys(filteredCollections).length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No lifelines found.' : 'No lifelines available.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
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

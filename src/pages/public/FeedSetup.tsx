import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFeedSubscriptions } from '@/hooks/useFeedData';

interface LifelineWithCollection {
  id: string;
  title: string;
  collection_id: string | null;
  collection_title: string;
  dated_entries: number;
}

export default function FeedSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLifelines, setSelectedLifelines] = useState<Set<string>>(new Set());

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch existing subscriptions
  const { data: existingSubscriptions = [] } = useFeedSubscriptions(user?.id);

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

      // Group by lifeline and count dated entries
      const lifelineMap = new Map<string, LifelineWithCollection>();
      
      data.forEach(item => {
        if (!lifelineMap.has(item.id)) {
          const collection = Array.isArray(item.collections) ? item.collections[0] : item.collections;
          lifelineMap.set(item.id, {
            id: item.id,
            title: item.title,
            collection_id: item.collection_id || 'standalone',
            collection_title: collection?.title || 'Standalone Lifelines',
            dated_entries: 0,
          });
        }
        const lifeline = lifelineMap.get(item.id)!;
        lifeline.dated_entries++;
      });

      return Array.from(lifelineMap.values());
    },
    enabled: !!user,
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

      // Delete all existing subscriptions
      await supabase
        .from('user_feed_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Insert new subscriptions
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
      navigate('/feed');
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Set Up Your Feed</h1>
          <p className="text-muted-foreground">
            Select which lifelines you want to follow. Events from these lifelines will appear in your personalized feed.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedLifelines.size} lifeline{selectedLifelines.size !== 1 ? 's' : ''} selected
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lifelines or collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {Object.entries(filteredCollections).map(([collectionId, { title, lifelines: collectionLifelines }]) => {
              const allSelected = collectionLifelines.every(l => selectedLifelines.has(l.id));
              const someSelected = collectionLifelines.some(l => selectedLifelines.has(l.id));

              return (
                <Collapsible key={collectionId}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => toggleCollection(collectionLifelines)}
                            onClick={(e) => e.stopPropagation()}
                            className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                          />
                          <div className="text-left">
                            <h3 className="font-semibold">{title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {collectionLifelines.length} lifeline{collectionLifelines.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t">
                        {collectionLifelines.map((lifeline) => (
                          <div
                            key={lifeline.id}
                            className="flex items-center gap-3 p-4 pl-12 hover:bg-accent/30 transition-colors cursor-pointer"
                            onClick={() => toggleLifeline(lifeline.id)}
                          >
                            <Checkbox
                              checked={selectedLifelines.has(lifeline.id)}
                              onCheckedChange={() => toggleLifeline(lifeline.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{lifeline.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {lifeline.dated_entries} dated event{lifeline.dated_entries !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {Object.keys(filteredCollections).length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No lifelines found matching your search.' : 'No lifelines with dated events available.'}
                </p>
              </Card>
            )}
          </div>
        )}

        <div className="flex gap-4 sticky bottom-6 bg-background p-4 border rounded-lg shadow-lg">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
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
          'Save Feed'
        )}
      </Button>
      </div>
    </div>
  );
}

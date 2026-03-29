import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Loader2, Check, Rss } from 'lucide-react';
import { toast } from 'sonner';

interface CollectionWithStats {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  card_image_url: string | null;
  event_count: number;
}

export default function FeedSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch existing collection subscriptions
  const { data: existingSubscriptions = [] } = useQuery({
    queryKey: ['collection-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_collection_subscriptions')
        .select('collection_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data?.map(s => s.collection_id) || [];
    },
    enabled: !!user,
  });

  // Initialize from existing subscriptions
  useEffect(() => {
    if (existingSubscriptions.length > 0) {
      setSelectedCollections(new Set(existingSubscriptions));
    }
  }, [existingSubscriptions]);

  // Fetch published collections with event counts
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections-for-feed-setup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id, title, slug, description, hero_image_url, card_image_url
        `)
        .eq('status', 'published')
        .order('title');

      if (error) throw error;

      // Get event counts per collection
      const collectionsWithStats: CollectionWithStats[] = await Promise.all(
        (data || []).map(async (col) => {
          const { count } = await supabase
            .from('entries')
            .select('id', { count: 'exact', head: true })
            .eq('collection_id', col.id)
            .not('occurred_on', 'is', null);

          return {
            ...col,
            event_count: count || 0,
          };
        })
      );

      return collectionsWithStats;
    },
    enabled: !!user,
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

      // Delete all existing collection subscriptions
      await supabase
        .from('user_collection_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Insert new ones
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
      navigate('/feed');
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Set Up Your Feed</h1>
        <p className="text-muted-foreground">
          Select collections to follow. Events from these collections will appear in your personalized feed.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedCollections.size} collection{selectedCollections.size !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="mb-6">
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredCollections.map((col) => {
            const isSelected = selectedCollections.has(col.id);
            const imageUrl = col.card_image_url || col.hero_image_url;

            return (
              <Card
                key={col.id}
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleCollection(col.id)}
              >
                {imageUrl && (
                  <div className="aspect-video relative bg-muted overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={col.title}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <Check className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{col.title}</h3>
                      {col.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {col.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {col.event_count} dated event{col.event_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {isSelected ? (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <Rss className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredCollections.length === 0 && (
            <Card className="p-8 text-center col-span-full">
              <p className="text-muted-foreground">
                {searchTerm ? 'No collections found matching your search.' : 'No published collections available.'}
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

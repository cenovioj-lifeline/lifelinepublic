import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function CollectionSettings() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collection, isLoading } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { quotes_enabled: boolean; quote_frequency: number }) => {
      const { error } = await supabase
        .from("collections")
        .update(settings)
        .eq("id", collection!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-collection", slug] });
      toast({
        title: "Settings updated",
        description: "Your collection settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleQuotes = (enabled: boolean) => {
    if (!collection) return;
    updateSettingsMutation.mutate({
      quotes_enabled: enabled,
      quote_frequency: collection.quote_frequency || 1,
    });
  };

  const handleUpdateFrequency = (frequency: number) => {
    if (!collection) return;
    updateSettingsMutation.mutate({
      quotes_enabled: collection.quotes_enabled ?? true,
      quote_frequency: frequency,
    });
  };

  if (isLoading || !collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div>Loading...</div>
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      primaryColor={collection.primary_color}
      secondaryColor={collection.secondary_color}
      webPrimary={collection.web_primary}
      webSecondary={collection.web_secondary}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/public/collections/${slug}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Collection Settings</h1>
            <p className="text-muted-foreground">
              Customize your experience in {collection.title}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quote Display</CardTitle>
            <CardDescription>
              Control how quotes appear throughout the collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quotes-enabled">Enable Quotes</Label>
                <p className="text-sm text-muted-foreground">
                  Show inspirational quotes as you navigate
                </p>
              </div>
              <Switch
                id="quotes-enabled"
                checked={collection.quotes_enabled ?? true}
                onCheckedChange={handleToggleQuotes}
                disabled={updateSettingsMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-frequency">Quote Frequency</Label>
              <p className="text-sm text-muted-foreground mb-2">
                How often should quotes appear (1 = every page)
              </p>
              <div className="flex items-center gap-4">
                <Input
                  id="quote-frequency"
                  type="number"
                  min="1"
                  max="10"
                  value={collection.quote_frequency || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 10) {
                      handleUpdateFrequency(val);
                    }
                  }}
                  disabled={!collection.quotes_enabled || updateSettingsMutation.isPending}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  pages between quotes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CollectionLayout>
  );
}
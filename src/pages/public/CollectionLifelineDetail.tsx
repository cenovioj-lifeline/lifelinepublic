import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LifelineViewer } from "@/components/lifeline/LifelineViewer";
import { CollectionLayout } from "@/components/CollectionLayout";
import { FavoriteButton } from "@/components/FavoriteButton";
import { LifelineDisclaimerDialog } from "@/components/lifeline/LifelineDisclaimerDialog";
import { useState, useEffect } from "react";

export default function CollectionLifelineDetail() {
  const { collectionSlug, lifelineSlug } = useParams<{ collectionSlug: string; lifelineSlug: string }>();
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data: lifeline, isLoading } = useQuery({
    queryKey: ["collection-lifeline", collectionSlug, lifelineSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          id,
          title,
          slug,
          lifeline_type,
          collection_id,
          collections!lifelines_collection_id_fkey(
            id,
            title,
            slug,
            primary_color,
            secondary_color,
            web_primary,
            web_secondary,
            menu_text_color,
            menu_hover_color,
            menu_active_color,
            collection_bg_color,
            collection_text_color,
            collection_heading_color,
            collection_accent_color,
            collection_card_bg,
            collection_border_color,
            collection_muted_text,
            collection_badge_color
          )
        `)
        .eq("slug", lifelineSlug)
        .eq("status", "published")
        .eq("visibility", "public")
        .single();

      if (error) throw error;
      
      // Verify this lifeline belongs to the collection
      if (data.collections?.slug !== collectionSlug) {
        throw new Error("Lifeline not found in this collection");
      }
      
      return data;
    },
  });

  // Check if user is authenticated and if they've dismissed the disclaimer
  useEffect(() => {
    const checkDisclaimerPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Only show disclaimer for person lifelines
      if (lifeline && lifeline.lifeline_type === "person") {
        if (user) {
          // Check if user has dismissed the disclaimer
          const { data: preferences } = await supabase
            .from("user_preferences")
            .select("hide_person_lifeline_disclaimer")
            .eq("user_id", user.id)
            .single();

          if (!preferences?.hide_person_lifeline_disclaimer) {
            setShowDisclaimer(true);
          }
        } else {
          // Not authenticated, always show disclaimer
          setShowDisclaimer(true);
        }
      }
    };

    if (lifeline) {
      checkDisclaimerPreference();
    }
  }, [lifeline]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lifeline) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-base text-muted-foreground">Lifeline not found</p>
        <Button onClick={() => navigate(`/public/collections/${collectionSlug}/lifelines`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lifelines
        </Button>
      </div>
    );
  }

  const collection = lifeline.collections as any;

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="flex justify-end mb-1 lg:mb-4">
        <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
      </div>
        <LifelineViewer
          lifelineId={lifeline.id}
          lifelineType={lifeline.lifeline_type}
        />
      <LifelineDisclaimerDialog
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        isAuthenticated={isAuthenticated}
      />
    </CollectionLayout>
  );
}

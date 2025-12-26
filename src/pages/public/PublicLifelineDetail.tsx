import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LifelineViewer } from "@/components/lifeline/LifelineViewer";
import { PublicLayout } from "@/components/PublicLayout";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FloatingBackButton } from "@/components/FloatingBackButton";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LifelineDisclaimerDialog } from "@/components/lifeline/LifelineDisclaimerDialog";
import { useState, useEffect } from "react";

export default function PublicLifelineDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data: lifeline, isLoading } = useQuery({
    queryKey: ["public-lifeline", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, slug, lifeline_type, collection_id")
        .eq("slug", slug)
        .eq("status", "published")
        .eq("visibility", "public")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Apply color scheme based on collection - will load default first, then collection-specific when lifeline loads
  useColorScheme(lifeline?.collection_id);

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
      <PublicLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PublicLayout>
    );
  }

  if (!lifeline) {
    return (
      <PublicLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lifeline not found</p>
          <Button onClick={() => navigate("/public/lifelines")} className="mt-4">
            Back to Lifelines
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="space-y-6">
        <div className="hidden md:flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/public/lifelines")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lifelines
          </Button>
          <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
        </div>
        <LifelineViewer 
          lifelineId={lifeline.id}
        />
      </div>
      
      {/* Floating back button for mobile */}
      <FloatingBackButton />
      
      <LifelineDisclaimerDialog
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        isAuthenticated={isAuthenticated}
      />
    </PublicLayout>
  );
}

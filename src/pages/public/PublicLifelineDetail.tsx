import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LifelineViewer } from "@/components/lifeline/LifelineViewer";
import { PublicLayout } from "@/components/PublicLayout";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function PublicLifelineDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: lifeline, isLoading } = useQuery({
    queryKey: ["public-lifeline", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, slug")
        .eq("slug", slug)
        .eq("status", "published")
        .eq("visibility", "public")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: colorSettings } = useQuery({
    queryKey: ["lifeline-color-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifeline_settings")
        .select("*")
        .in("setting_key", [
          "lifeline_timeline_positive",
          "lifeline_timeline_negative",
        ]);
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach((s) => {
        settings[s.setting_key] = s.setting_value || "";
      });
      return settings;
    },
  });

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
        <div className="flex items-center justify-between mb-4">
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
          primaryColor={colorSettings?.lifeline_timeline_positive}
          secondaryColor={colorSettings?.lifeline_timeline_negative}
        />
      </div>
    </PublicLayout>
  );
}

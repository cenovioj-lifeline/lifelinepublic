import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LifelineViewer } from "@/components/lifeline/LifelineViewer";
import { PublicLayout } from "@/components/PublicLayout";

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
        <Button
          variant="ghost"
          onClick={() => navigate("/public/lifelines")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lifelines
        </Button>
        <LifelineViewer lifelineId={lifeline.id} />
      </div>
    </PublicLayout>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { ProfileDetailView } from "@/components/ProfileDetailView";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileData } from "@/hooks/useProfileData";

export default function PublicProfileDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { profile, isLoading } = useProfileData(slug);


  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-8">
            <div className="flex gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-4 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!profile) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <Button onClick={() => navigate("/public/profiles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiles
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const associatedLifelines = profile.profile_lifelines?.map(
    (pl: any) => ({ ...pl.lifeline, relationship_type: pl.relationship_type })
  ).filter(Boolean) || [];

  const collections = profile.profile_collections?.map(
    (pc: any) => pc.collection
  ).filter(Boolean) || [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/public/profiles")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>

        <ProfileDetailView
          profile={profile as any}
          associatedLifelines={associatedLifelines}
          collections={collections}
        />
      </div>
    </PublicLayout>
  );
}

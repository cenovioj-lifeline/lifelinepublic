import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionLayout } from "@/components/CollectionLayout";
import { ProfileDetailView } from "@/components/ProfileDetailView";
import { useProfileData } from "@/hooks/useProfileData";

export default function CollectionProfileDetail() {
  const { collectionSlug, profileSlug } = useParams<{ collectionSlug: string; profileSlug: string }>();
  const navigate = useNavigate();

  const { profile, lifelinesData, isLoading } = useProfileData(profileSlug, { collectionSlug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-base text-muted-foreground">Profile not found</p>
        <Button onClick={() => navigate(`/public/collections/${collectionSlug}/profiles`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>
      </div>
    );
  }

  const collection = (profile.profile_collections as any[])?.[0]?.collection;
  const associatedLifelines = (profile.profile_lifelines as any[])
    ?.map((pl: any) => pl.lifeline)
    .filter(Boolean) || [];

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <ProfileDetailView
          profile={profile as any}
          associatedLifelines={lifelinesData ?? associatedLifelines}
          collections={[]}
          collectionContext={{
            slug: collectionSlug!,
            name: collection.title
          }}
        />
        
        <Button 
          onClick={() => navigate(`/public/collections/${collectionSlug}/profiles`)}
          variant="outline"
          className="mt-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>
      </div>
    </CollectionLayout>
  );
}

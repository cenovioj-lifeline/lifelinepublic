import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useCanEditCollection } from "@/hooks/useCanEditCollection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface ManageCollectionTileProps {
  collectionSlug: string;
  collectionId: string | undefined;
}

export function ManageCollectionTile({ collectionSlug, collectionId }: ManageCollectionTileProps) {
  const { user } = useAuth();
  const { canEdit, loading } = useCanEditCollection(collectionId);

  // Only show if user is logged in and can edit
  if (!user || loading || !canEdit) {
    return null;
  }

  return (
    <Link to={`/public/collections/${collectionSlug}/manage`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Manage Collection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Edit lifelines, profiles, quotes, settings, and team members.
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

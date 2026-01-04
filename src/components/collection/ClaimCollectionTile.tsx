import { UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useCollectionRole } from "@/hooks/useCollectionRole";

interface ClaimCollectionTileProps {
  collectionSlug: string;
  collectionId: string;
}

/**
 * Tile for the More area that allows users to claim ownership of a collection.
 * Only shows if:
 * - User is logged in
 * - User does NOT already have a role in this collection
 */
export function ClaimCollectionTile({ collectionSlug, collectionId }: ClaimCollectionTileProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading } = useCollectionRole(collectionId);

  // Don't show if not logged in
  if (!user) {
    return null;
  }

  // Don't show while loading
  if (loading) {
    return null;
  }

  // Don't show if user already has a role
  if (role) {
    return null;
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]"
      onClick={() => navigate(`/public/collections/${collectionSlug}/claim`)}
    >
      <CardContent className="pt-6 text-center">
        <UserCheck
          className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--scheme-cards-text))]"
        />
        <div className="text-sm font-medium mb-1 text-[hsl(var(--scheme-card-text))]">Claim Collection</div>
        <div className="text-xs text-[hsl(var(--scheme-cards-text))]">
          Request ownership
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Profile } from "@/types/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { ProfileSerpApiSearchModal } from "@/components/admin/ProfileSerpApiSearchModal";
import { ProfileAvatarUpload } from "./ProfileAvatarUpload";

interface ProfileHeroProps {
  profile: Profile & { 
    avatar_image?: { 
      url: string; 
      alt_text?: string;
      id?: string;
      position_x?: number;
      position_y?: number;
      scale?: number;
    };
    image_query?: string;
  };
  onImageUpdate?: () => void;
}

export function ProfileHero({ profile, onImageUpdate }: ProfileHeroProps) {
  const { hasAccess } = useAdminAccess();
  const [showSerpModal, setShowSerpModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-2">
          <ProfileAvatarUpload 
            profile={profile} 
            onImageUpdate={onImageUpdate}
          />
          
          {hasAccess && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSerpModal(true)}
              className="text-xs"
            >
              Image
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary">{profile.subject_type}</Badge>
              <Badge variant="outline">{profile.reality_status}</Badge>
              {profile.subject_status && (
                <Badge variant="outline">{profile.subject_status}</Badge>
              )}
            </div>
          </div>

          {profile.short_description && (
            <p className="text-lg text-muted-foreground">
              {profile.short_description}
            </p>
          )}

          {profile.known_for && profile.known_for.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Known For
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.known_for.map((item, index) => (
                  <Badge key={index} variant="default">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ProfileSerpApiSearchModal
        open={showSerpModal}
        onClose={() => setShowSerpModal(false)}
        profileId={profile.id}
        initialQuery={profile.image_query || profile.name}
        onImportComplete={onImageUpdate}
      />
    </div>
  );
}

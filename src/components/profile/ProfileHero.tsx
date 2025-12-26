import { useState } from "react";
import { Profile } from "@/types/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { ProfileSerpApiSearchModal } from "@/components/admin/ProfileSerpApiSearchModal";
import { ProfileAvatarUpload } from "./ProfileAvatarUpload";
import { ProfileImageEditor } from "./ProfileImageEditor";

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
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileHero({ profile, onImageUpdate, collectionContext }: ProfileHeroProps) {
  const { hasAccess } = useAdminAccess();
  const [showSerpModal, setShowSerpModal] = useState(false);

  const hasImage = profile.avatar_image?.url || profile.primary_image_url;
  
  const textStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined;
  const mutedStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-2">
          <ProfileAvatarUpload
            profile={profile}
            onImageUpdate={onImageUpdate}
          />

          {hasAccess && (
            <div className="flex gap-2">
              {hasImage ? (
                <ProfileImageEditor
                  profile={profile}
                  onImageUpdate={onImageUpdate}
                />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowSerpModal(true)}
                  className="text-xs"
                >
                  Add Image
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={textStyle}>{profile.name}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-[hsl(var(--scheme-nav-button))] text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button)/.9)] border-none">
                {profile.subject_type}
              </Badge>
              <Badge variant="outline" className="border-[hsl(var(--scheme-nav-button))] text-[hsl(var(--scheme-nav-button))]">
                {profile.reality_status}
              </Badge>
              {profile.subject_status && (
                <Badge variant="outline" className="border-[hsl(var(--scheme-nav-button))] text-[hsl(var(--scheme-nav-button))]">
                  {profile.subject_status}
                </Badge>
              )}
            </div>
          </div>

          {profile.short_description && (
            <p 
              className="text-lg"
              style={mutedStyle}
            >
              {profile.short_description}
            </p>
          )}

          {(profile as any).long_description && (
            <div className="mt-4 space-y-3 text-base" style={mutedStyle}>
              {((profile as any).long_description as string).split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < paragraph.split('\n').length - 1 && <br />}</span>
                ))}</p>
              ))}
            </div>
          )}

          {profile.known_for && profile.known_for.length > 0 && (
            <div className="space-y-2">
              <h3 
                className="font-semibold text-sm uppercase tracking-wide"
                style={mutedStyle}
              >
                Known For
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.known_for.map((item, index) => (
                  <Badge key={index} className="bg-[hsl(var(--scheme-nav-button))] text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button)/.9)]">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <div className="space-y-2">
              <h3 
                className="font-semibold text-sm uppercase tracking-wide"
                style={mutedStyle}
              >
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="border-[hsl(var(--scheme-nav-button))] text-[hsl(var(--scheme-nav-button))]">
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

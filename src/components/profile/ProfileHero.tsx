import { Profile, getInitials } from "@/types/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileHeroProps {
  profile: Profile & { avatar_image?: { url: string; alt_text?: string } };
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="h-32 w-32 flex-shrink-0">
          <AvatarImage 
            src={profile.avatar_image?.url || profile.primary_image_url || undefined} 
            alt={profile.avatar_image?.alt_text || profile.name}
          />
          <AvatarFallback className="text-2xl">
            {getInitials(profile.name)}
          </AvatarFallback>
        </Avatar>

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
    </div>
  );
}

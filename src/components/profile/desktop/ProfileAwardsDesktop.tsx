import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useProfileAwardNavigation, ProfileAward } from "@/hooks/useProfileAwardNavigation";
import { ProfileAwardDialog } from "./ProfileAwardDialog";

interface ProfileAwardsDesktopProps {
  awards: ProfileAward[];
  collectionSlug?: string;
  profile: {
    name?: string;
    avatar_image?: {
      url?: string;
      position_x?: number;
      position_y?: number;
      scale?: number;
    };
  };
}

export function ProfileAwardsDesktop({
  awards,
  collectionSlug,
  profile,
}: ProfileAwardsDesktopProps) {
  const [expanded, setExpanded] = useState(false);
  const awardNavigation = useProfileAwardNavigation(awards);

  // Get the first election slug for the "View All" link
  const firstElectionSlug = awards[0]?.election?.slug;
  const viewAllPath = collectionSlug && firstElectionSlug
    ? `/public/collections/${collectionSlug}/elections/${firstElectionSlug}`
    : firstElectionSlug
      ? `/public/elections/${firstElectionSlug}`
      : null;

  const labelStyle = collectionSlug 
    ? { color: 'hsl(var(--scheme-profile-label-text))' } 
    : undefined;
  const labelMutedStyle = collectionSlug 
    ? { color: 'hsl(var(--scheme-profile-label-text))', opacity: 0.7 } 
    : undefined;

  return (
    <section className="space-y-2">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger
          className={`w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
            collectionSlug 
              ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
              : 'bg-card'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="font-semibold" style={labelStyle}>Awards</span>
            <Badge 
              variant="secondary"
              className={collectionSlug ? 'bg-[hsl(var(--scheme-nav-bg))] text-[hsl(var(--scheme-nav-text))] border-transparent' : ''}
            >
              {awards.length}
            </Badge>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform",
            expanded && "rotate-180"
          )} style={labelMutedStyle} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Awards Grid - 2 columns matching lifeline cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {awards.map((award, index) => (
              <button
                key={award.id}
                onClick={() => awardNavigation.openDetail(index)}
                className={`w-full flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all text-left ${
                  collectionSlug 
                    ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                    : 'bg-card'
                }`}
              >
                <Trophy className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={labelStyle}>
                    {award.category}
                  </p>
                  <p className="text-sm truncate" style={labelMutedStyle}>
                    {award.notes || award.election.title}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={labelMutedStyle} />
              </button>
            ))}
          </div>

          {/* View All Collection Awards Button */}
          {viewAllPath && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                asChild
                className={collectionSlug ? 'border-[hsl(var(--scheme-cards-border))]' : ''}
              >
                <Link to={viewAllPath} className="inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  View All Collection Awards
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Award Detail Dialog */}
      <ProfileAwardDialog
        award={awardNavigation.currentAward}
        isOpen={awardNavigation.isDetailOpen}
        onClose={awardNavigation.closeDetail}
        onNavigate={awardNavigation.navigateDetail}
        canNavigatePrev={awardNavigation.canNavigate('prev')}
        canNavigateNext={awardNavigation.canNavigate('next')}
        currentIndex={awardNavigation.currentIndex}
        totalCount={awards.length}
        collectionSlug={collectionSlug}
        winnerAvatar={{
          url: profile.avatar_image?.url,
          position_x: profile.avatar_image?.position_x,
          position_y: profile.avatar_image?.position_y,
          scale: profile.avatar_image?.scale,
        }}
        winnerInitials={profile.name?.slice(0, 2).toUpperCase()}
      />
    </section>
  );
}

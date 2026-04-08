import { useState } from "react";
import { Link } from "react-router-dom";
import { Profile, hasModule } from "@/types/profile";
import { ProfileHero } from "./profile/ProfileHero";
import { ProfileQuickFacts } from "./profile/ProfileQuickFacts";
import { ProfileBiography } from "./profile/ProfileBiography";
import { ProfileRelationships } from "./profile/ProfileRelationships";
import { ProfileWorks } from "./profile/ProfileWorks";
import { ProfileBooksSection } from "./profile/ProfileBooksSection";
import { ProfileLegacyImpact } from "./profile/ProfileLegacyImpact";
import { ProfilePhysicalCharacteristics } from "./profile/ProfilePhysicalCharacteristics";
import { ProfileAwardsDesktop } from "./profile/desktop/ProfileAwardsDesktop";
import { LifelineBookIcon } from "./icons/LifelineBookIcon";
import { Trophy, Quote, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { lifelineLink } from "@/lib/navigationLinks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfileAwardNavigation, ProfileAward } from "@/hooks/useProfileAwardNavigation";
import { ProfileAwardDetailSheet } from "./profile/mobile/ProfileAwardDetailSheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface ProfileRelationship {
  id: string;
  relationship_type: string;
  target_name: string;
  context?: string;
  related_profile?: {
    id: string;
    name: string;
    slug: string;
    subject_type: string;
  } | null;
}

interface ProfileWork {
  id: string;
  work_category: string;
  title: string;
  year?: string;
  work_type?: string;
  significance?: string;
  additional_info?: any;
}

interface ProfileWithRelations extends Profile {
  avatar_image?: { 
    url: string; 
    alt_text?: string;
    id?: string;
    position_x?: number;
    position_y?: number;
    scale?: number;
  };
  image_query?: string;
  profile_relationships: ProfileRelationship[];
  profile_works: ProfileWork[];
}

interface ProfileDetailViewProps {
  profile: ProfileWithRelations;
  associatedLifelines?: any[];
  collections?: any[];
  awards?: any[];
  quotes?: any[];
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileDetailView({
  profile,
  associatedLifelines = [],
  collections = [],
  awards = [],
  quotes = [],
  collectionContext,
}: ProfileDetailViewProps) {
  const [quotesExpanded, setQuotesExpanded] = useState(false);
  const [awardsExpanded, setAwardsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  // Cast awards to ProfileAward type for the navigation hook
  const typedAwards = (awards || []) as ProfileAward[];
  const awardNavigation = useProfileAwardNavigation(typedAwards);
  const textStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined;
  const mutedStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined;
  const labelStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-label-text))' } : undefined;
  const labelMutedStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-label-text))', opacity: 0.7 } : undefined;

  // Helper to create lifeline path with referrer tracking
  const getLifelinePath = (lifelineSlug: string) => {
    return lifelineLink(lifelineSlug, {
      collectionSlug: collectionContext?.slug,
      from: { type: 'profile', slug: profile.slug }
    });
  };

  return (
    <div className="space-y-8">
      <ProfileHero profile={profile} onImageUpdate={() => window.location.reload()} collectionContext={collectionContext} />

      {(hasModule(profile, 'biographical') || 
        hasModule(profile, 'fictional') || 
        hasModule(profile, 'organization')) && (
        <ProfileQuickFacts profile={profile} collectionContext={collectionContext} />
      )}

      {(hasModule(profile, 'biographical') || 
        hasModule(profile, 'fictional') || 
        hasModule(profile, 'organization')) && (
        <ProfileBiography profile={profile} collectionContext={collectionContext} />
      )}

      {profile.profile_relationships && profile.profile_relationships.length > 0 && (
        <ProfileRelationships 
          relationships={profile.profile_relationships}
          collectionSlug={collectionContext?.slug}
        />
      )}

      {profile.profile_works && profile.profile_works.length > 0 && (
        <ProfileWorks works={profile.profile_works} collectionSlug={collectionContext?.slug} />
      )}

      {/* Books section for real-person profiles (authors) */}
      {(profile.subject_type === 'Person' || (profile.subject_type as string) === 'person_real') && (
        <ProfileBooksSection
          profileSlug={profile.slug}
          collectionSlug={collectionContext?.slug}
        />
      )}

      {hasModule(profile, 'legacy') && (
        <ProfileLegacyImpact profile={profile} collectionContext={collectionContext} />
      )}

      {hasModule(profile, 'physical') && (
        <ProfilePhysicalCharacteristics profile={profile} collectionContext={collectionContext} />
      )}

      {(() => {
        // Person profiles: single subject lifeline of type 'person'
        const myPersonLifeline = associatedLifelines?.find((lifeline: any) => 
          lifeline.relationship_type === 'subject' && lifeline.lifeline_type === 'person'
        );
        
        // Organization profiles: multiple subject lifelines of type 'org', sorted by title
        const myOrgLifelines = associatedLifelines?.filter((lifeline: any) => 
          lifeline.relationship_type === 'subject' && lifeline.lifeline_type === 'org'
        )?.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
        
        // Rating lifelines (separate section)
        const ratingLifelines = associatedLifelines?.filter((lifeline: any) => 
          lifeline.relationship_type !== 'subject' && lifeline.lifeline_type === 'rating'
        );
        
        // All non-subject lifelines except ratings (appears in)
        const appearsInLifelines = associatedLifelines?.filter((lifeline: any) => 
          lifeline.relationship_type !== 'subject' && lifeline.lifeline_type !== 'rating'
        );

        const isOrganization = profile.subject_type?.toLowerCase() === 'organization';

        return (
          <>
            {/* Person profiles: My Lifeline (single) */}
            {myPersonLifeline && !isOrganization && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>My Lifeline</h2>
                <Link 
                  to={getLifelinePath(myPersonLifeline.slug)}
                  className="group block"
                >
                  <div className={`p-4 border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer ${
                    collectionContext 
                      ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                      : 'bg-card'
                  }`}>
                        <div className="flex items-center gap-2">
                          <LifelineBookIcon size={20} />
                          <h3 className="font-semibold group-hover:text-primary transition-colors" style={labelStyle}>
                            {myPersonLifeline.title}
                          </h3>
                        </div>
                        <p className={`text-sm ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>{myPersonLifeline.type}</p>
                  </div>
                </Link>
              </section>
            )}

            {/* Organization profiles: Organization Lifelines (multiple, sorted by title) */}
            {myOrgLifelines && myOrgLifelines.length > 0 && isOrganization && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>Organization Lifelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myOrgLifelines.map((lifeline: any) => (
                    <Link key={lifeline.id} to={getLifelinePath(lifeline.slug)} className="group block">
                      <div className={`p-4 border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer ${
                        collectionContext 
                          ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                          : 'bg-card'
                      }`}>
                        <div className="flex items-center gap-2">
                          <LifelineBookIcon size={20} />
                          <h3 className="font-semibold group-hover:text-primary transition-colors" style={labelStyle}>
                            {lifeline.title}
                          </h3>
                        </div>
                        <p className={`text-sm ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>{lifeline.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Opinion Lifelines (rating type) - between subject lifelines and appears in */}
            {ratingLifelines && ratingLifelines.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>Opinion Lifelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratingLifelines.map((lifeline: any) => (
                    <Link key={lifeline.id} to={getLifelinePath(lifeline.slug)} className="group block">
                      <div className={`p-4 border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer ${
                        collectionContext 
                          ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                          : 'bg-card'
                      }`}>
                        <div className="flex items-center gap-2">
                          <LifelineBookIcon size={20} />
                          <h3 className="font-semibold group-hover:text-primary transition-colors" style={labelStyle}>
                            {lifeline.title}
                          </h3>
                        </div>
                        <p className={`text-sm ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>{lifeline.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {appearsInLifelines && appearsInLifelines.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>Appears in Lifelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appearsInLifelines.map((lifeline: any) => (
                    <Link key={lifeline.id} to={getLifelinePath(lifeline.slug)} className="group block">
                      <div className={`p-4 border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer ${
                        collectionContext 
                          ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                          : 'bg-card'
                      }`}>
                        <div className="flex items-center gap-2">
                          <LifelineBookIcon size={20} />
                          <h3 className="font-semibold group-hover:text-primary transition-colors" style={labelStyle}>
                            {lifeline.title}
                          </h3>
                        </div>
                        <p className={`text-sm ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>{lifeline.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        );
      })()}

      {awards && awards.length > 0 && (
        isMobile ? (
          // Mobile: Collapsible awards with detail sheet (unchanged)
          <section className="space-y-2">
            <Collapsible open={awardsExpanded} onOpenChange={setAwardsExpanded}>
              <CollapsibleTrigger
                className={`w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                  collectionContext 
                    ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                    : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold" style={labelStyle}>Awards</span>
                  <Badge 
                    variant="secondary"
                    className={collectionContext ? 'bg-[hsl(var(--scheme-nav-bg))] text-[hsl(var(--scheme-nav-text))] border-transparent' : ''}
                  >
                    {awards.length}
                  </Badge>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 transition-transform",
                  awardsExpanded && "rotate-180"
                )} style={labelMutedStyle} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2 space-y-2">
                {awards.map((award: any, index: number) => (
                  <button
                    key={award.id}
                    onClick={() => awardNavigation.openDetail(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer active:scale-[0.98] transition-all text-left ${
                      collectionContext 
                        ? 'bg-[hsl(var(--scheme-cards-bg))] border border-[hsl(var(--scheme-cards-border))] hover:border-amber-400/50' 
                        : 'bg-amber-50/50 hover:bg-amber-100/50'
                    }`}
                  >
                    <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={labelStyle}>
                        {award.category}
                      </p>
                      <p className="text-xs truncate" style={labelMutedStyle}>
                        {award.notes || award.election.title}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={labelMutedStyle} />
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <ProfileAwardDetailSheet
              award={awardNavigation.currentAward}
              isOpen={awardNavigation.isDetailOpen}
              onClose={awardNavigation.closeDetail}
              onNavigate={awardNavigation.navigateDetail}
              canNavigatePrev={awardNavigation.canNavigate('prev')}
              canNavigateNext={awardNavigation.canNavigate('next')}
              currentIndex={awardNavigation.currentIndex}
              totalCount={awards.length}
              collectionSlug={collectionContext?.slug}
              winnerAvatar={{
                url: profile.avatar_image?.url,
                position_x: profile.avatar_image?.position_x,
                position_y: profile.avatar_image?.position_y,
                scale: profile.avatar_image?.scale,
              }}
              winnerInitials={profile.name?.slice(0, 2).toUpperCase()}
            />
          </section>
        ) : (
          // Desktop: New collapsible grid with dialog popup
          <ProfileAwardsDesktop
            awards={typedAwards}
            collectionSlug={collectionContext?.slug}
            profile={profile}
          />
        )
      )}

      {quotes && quotes.length > 0 && (
        <section className="space-y-2">
          <button 
            onClick={() => setQuotesExpanded(!quotesExpanded)}
            className={`w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
              collectionContext 
                ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5" style={labelMutedStyle} />
              <span className="font-semibold" style={labelStyle}>Notable Quotes</span>
              <Badge 
                variant="secondary"
                className={collectionContext ? 'bg-[hsl(var(--scheme-nav-bg))] text-[hsl(var(--scheme-nav-text))] border-transparent' : ''}
              >
                {quotes.length}
              </Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              quotesExpanded && "rotate-180"
            )} style={labelMutedStyle} />
          </button>
          
          {quotesExpanded && (
            <div 
              className="space-y-3 p-4 rounded-lg mt-2"
              style={collectionContext ? { 
                backgroundColor: 'hsl(var(--scheme-cards-bg))',
                border: '1px solid hsl(var(--scheme-cards-border))'
              } : { 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            >
              {quotes.map((quoteItem: any) => (
                <div key={quoteItem.id} className="space-y-1">
                  <blockquote className="text-base italic" style={labelStyle}>
                    "{quoteItem.quote}"
                  </blockquote>
                  {quoteItem.context && (
                    <p className={`text-sm ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>— {quoteItem.context}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {collections && collections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold" style={textStyle}>Related Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((collection: any) => (
              <Link 
                key={collection.id} 
                to={`/public/collections/${collection.slug}`} 
                className="group block"
              >
                <div className={`p-4 border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer ${
                  collectionContext 
                    ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                    : 'bg-card'
                }`}>
                  <h3 className="font-semibold group-hover:text-primary transition-colors" style={labelStyle}>
                    {collection.title}
                  </h3>
                  {collection.description && (
                    <p className={`text-sm mt-1 line-clamp-2 ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>
                      {collection.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

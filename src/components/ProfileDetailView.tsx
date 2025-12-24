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
import { LifelineBookIcon } from "./icons/LifelineBookIcon";
import { Trophy, Quote, ChevronDown } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

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

  const textStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined;
  const mutedStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined;
  const labelStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-label-text))' } : undefined;
  const labelMutedStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-label-text))', opacity: 0.7 } : undefined;

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

        const isOrganization = profile.subject_type === 'Organization';

        return (
          <>
            {/* Person profiles: My Lifeline (single) */}
            {myPersonLifeline && !isOrganization && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>My Lifeline</h2>
                <Link 
                  to={collectionContext
                    ? `/public/collections/${collectionContext.slug}/lifelines/${myPersonLifeline.slug}`
                    : `/public/lifelines/${myPersonLifeline.slug}`
                  } 
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
                  {myOrgLifelines.map((lifeline: any) => {
                    const lifelinePath = collectionContext
                      ? `/public/collections/${collectionContext.slug}/lifelines/${lifeline.slug}`
                      : `/public/lifelines/${lifeline.slug}`;
                    
                    return (
                      <Link key={lifeline.id} to={lifelinePath} className="group block">
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
                    );
                  })}
                </div>
              </section>
            )}

            {appearsInLifelines && appearsInLifelines.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>Appears in Lifelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appearsInLifelines.map((lifeline: any) => {
                    const lifelinePath = collectionContext
                      ? `/public/collections/${collectionContext.slug}/lifelines/${lifeline.slug}`
                      : `/public/lifelines/${lifeline.slug}`;
                    
                    return (
                      <Link key={lifeline.id} to={lifelinePath} className="group block">
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
                    );
                  })}
                </div>
              </section>
            )}

            {ratingLifelines && ratingLifelines.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold" style={textStyle}>Rating Lifelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratingLifelines.map((lifeline: any) => {
                    const lifelinePath = collectionContext
                      ? `/public/collections/${collectionContext.slug}/lifelines/${lifeline.slug}`
                      : `/public/lifelines/${lifeline.slug}`;
                    
                    return (
                      <Link key={lifeline.id} to={lifelinePath} className="group block">
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
                    );
                  })}
                </div>
              </section>
            )}
          </>
        );
      })()}

      {awards && awards.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2" style={textStyle}>
            <Trophy className="h-6 w-6 text-yellow-500" />
            Mock Election Awards
          </h2>
          <div className="space-y-4">
            {awards.map((award: any) => (
              <Link
                key={award.id}
                to={collectionContext
                  ? `/public/collections/${collectionContext.slug}/elections/${award.election.slug}`
                  : `/public/elections/${award.election.slug}`
                }
                className="group block"
              >
                <Card className={`border hover:shadow-lg hover:border-primary/50 transition-all ${
                  collectionContext 
                    ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' 
                    : 'bg-card'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Trophy className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors" style={labelStyle}>
                          {award.category}
                        </h3>
                        <p className={`text-sm mt-1 ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>
                          {award.election.title}
                        </p>
                        {award.winner_name && (
                          <p className="text-sm mt-2" style={labelStyle}>
                            Winner: {award.winner_name}
                          </p>
                        )}
                        {award.notes && (
                          <p className={`mt-3 text-base italic ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>
                            {award.notes}
                          </p>
                        )}
                        {award.percentage && (
                          <p className={`text-xs mt-2 ${collectionContext ? '' : 'text-muted-foreground'}`} style={labelMutedStyle}>
                            {award.percentage}% of votes
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
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
              <Quote className="h-5 w-5" style={mutedStyle} />
              <span className="font-semibold" style={textStyle}>Notable Quotes</span>
              <Badge variant="secondary">{quotes.length}</Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              quotesExpanded && "rotate-180"
            )} style={mutedStyle} />
          </button>
          
          {quotesExpanded && (
            <div className="space-y-3 pl-4 border-l-2 border-muted ml-4 pt-2">
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

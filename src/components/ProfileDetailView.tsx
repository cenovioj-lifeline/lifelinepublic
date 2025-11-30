import { useState } from "react";
import { Link } from "react-router-dom";
import { Profile, hasModule } from "@/types/profile";
import { ProfileHero } from "./profile/ProfileHero";
import { ProfileQuickFacts } from "./profile/ProfileQuickFacts";
import { ProfileBiography } from "./profile/ProfileBiography";
import { ProfileRelationships } from "./profile/ProfileRelationships";
import { ProfileWorks } from "./profile/ProfileWorks";
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

  return (
    <div className="space-y-8">
      <ProfileHero profile={profile} onImageUpdate={() => window.location.reload()} />

      {(hasModule(profile, 'biographical') || 
        hasModule(profile, 'fictional') || 
        hasModule(profile, 'organization')) && (
        <ProfileQuickFacts profile={profile} />
      )}

      {(hasModule(profile, 'biographical') || 
        hasModule(profile, 'fictional') || 
        hasModule(profile, 'organization')) && (
        <ProfileBiography profile={profile} />
      )}

      {profile.profile_relationships && profile.profile_relationships.length > 0 && (
        <ProfileRelationships 
          relationships={profile.profile_relationships}
          collectionSlug={collectionContext?.slug}
        />
      )}

      {profile.profile_works && profile.profile_works.length > 0 && (
        <ProfileWorks works={profile.profile_works} />
      )}

      {hasModule(profile, 'legacy') && (
        <ProfileLegacyImpact profile={profile} />
      )}

      {hasModule(profile, 'physical') && (
        <ProfilePhysicalCharacteristics profile={profile} />
      )}

      {(() => {
        const myLifeline = associatedLifelines?.find((lifeline: any) => lifeline.relationship_type === 'subject');
        const appearsInLifelines = associatedLifelines?.filter((lifeline: any) => lifeline.relationship_type !== 'subject');

        return (
          <>
            {myLifeline && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">My Lifeline</h2>
                <Link 
                  to={collectionContext
                    ? `/public/collections/${collectionContext.slug}/lifelines/${myLifeline.slug}`
                    : `/public/lifelines/${myLifeline.slug}`
                  } 
                  className="group block"
                >
                  <div className="p-4 border rounded-lg bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <LifelineBookIcon size={20} />
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {myLifeline.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{myLifeline.type}</p>
                  </div>
                </Link>
              </section>
            )}

            {appearsInLifelines && appearsInLifelines.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Appears in Lifelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appearsInLifelines.map((lifeline: any) => {
                    const lifelinePath = collectionContext
                      ? `/public/collections/${collectionContext.slug}/lifelines/${lifeline.slug}`
                      : `/public/lifelines/${lifeline.slug}`;
                    
                    return (
                      <Link key={lifeline.id} to={lifelinePath} className="group block">
                        <div className="p-4 border rounded-lg bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <LifelineBookIcon size={20} />
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {lifeline.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{lifeline.type}</p>
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
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
                <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:shadow-lg hover:border-yellow-400 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Trophy className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-amber-900 group-hover:text-amber-700 transition-colors">
                          {award.category}
                        </h3>
                        
                        <p className="text-sm text-amber-700/80 mt-1">
                          {award.election.title}
                        </p>
                        
                        {award.notes && (
                          <p className="mt-3 text-base text-gray-700 italic">
                            "{award.notes}"
                          </p>
                        )}
                        
                        {award.percentage && (
                          <p className="text-xs text-amber-600 mt-2">
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
            className="w-full flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Notable Quotes</span>
              <Badge variant="secondary">{quotes.length}</Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              quotesExpanded && "rotate-180"
            )} />
          </button>
          
          {quotesExpanded && (
            <div className="space-y-3 pl-4 border-l-2 border-muted ml-4 pt-2">
              {quotes.map((quoteItem: any) => (
                <div key={quoteItem.id} className="space-y-1">
                  <blockquote className="text-base italic">
                    "{quoteItem.quote}"
                  </blockquote>
                  {quoteItem.context && (
                    <p className="text-sm text-muted-foreground">— {quoteItem.context}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {collections && collections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Related Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((collection: any) => (
              <Link 
                key={collection.id} 
                to={`/public/collections/${collection.slug}`} 
                className="group block"
              >
                <div className="p-4 border rounded-lg bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {collection.title}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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

/**
 * PROTOTYPE PAGE - For Profile UI experimentation
 * Access at: /prototype/profile
 * 
 * Tests different profile page layouts and section arrangements.
 * Uses Scott Galloway's profile as the test subject.
 */

import { useState } from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { 
  Book, 
  ChevronDown, 
  ChevronRight, 
  Award, 
  Quote, 
  User, 
  MapPin,
  Briefcase,
  Calendar,
  ExternalLink,
  BookOpen,
  Trophy,
  MessageSquareQuote,
  Sparkles
} from "lucide-react";
import { hasModule, getInitials, formatDate } from "@/types/profile";

type LayoutType = 'current' | 'magazine' | 'compact';

export default function ProfilePrototype() {
  const [activeLayout, setActiveLayout] = useState<LayoutType>('current');
  
  // Fetch Scott Galloway profile data
  const { profile, lifelinesData, awards, quotes, isLoading, error } = useProfileData('scott-galloway', {
    collectionSlug: 'prof-g-media'
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Error loading profile data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Layout Switcher Banner */}
      <div className="sticky top-0 z-50 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 p-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Profile Layout:
          </span>
          <ToggleGroup 
            type="single" 
            value={activeLayout} 
            onValueChange={(value) => value && setActiveLayout(value as LayoutType)}
            className="bg-white/50 dark:bg-black/20 rounded-lg p-1"
          >
            <ToggleGroupItem value="current" className="text-xs sm:text-sm px-3">
              Current
            </ToggleGroupItem>
            <ToggleGroupItem value="magazine" className="text-xs sm:text-sm px-3">
              Magazine
            </ToggleGroupItem>
            <ToggleGroupItem value="compact" className="text-xs sm:text-sm px-3">
              Compact
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Render selected layout */}
      <div className="p-4 sm:p-6">
        {activeLayout === 'current' && (
          <CurrentLayout 
            profile={profile} 
            lifelinesData={lifelinesData} 
            awards={awards} 
            quotes={quotes} 
          />
        )}
        {activeLayout === 'magazine' && (
          <MagazineLayout 
            profile={profile} 
            lifelinesData={lifelinesData} 
            awards={awards} 
            quotes={quotes} 
          />
        )}
        {activeLayout === 'compact' && (
          <CompactLayout 
            profile={profile} 
            lifelinesData={lifelinesData} 
            awards={awards} 
            quotes={quotes} 
          />
        )}
      </div>
    </div>
  );
}

// Props interface for layout components
interface LayoutProps {
  profile: any;
  lifelinesData: any[] | undefined;
  awards: any[] | undefined;
  quotes: any[] | undefined;
}

// ============================================
// LAYOUT A: CURRENT (Baseline)
// ============================================
function CurrentLayout({ profile, lifelinesData, awards, quotes }: LayoutProps) {
  const avatarUrl = profile.avatar_image?.url || profile.avatar_url;
  const bio = profile.extended_data?.biographical;
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Section - Current Style */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="h-32 w-32 shrink-0 mx-auto sm:mx-0">
              <AvatarImage src={avatarUrl} alt={profile.name} />
              <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.name}</h1>
              {profile.short_description && (
                <p className="text-muted-foreground mt-2">{profile.short_description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                <Badge variant="secondary">{profile.subject_type}</Badge>
                {profile.reality_status && (
                  <Badge variant="outline">{profile.reality_status}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Facts */}
      {bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Quick Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bio.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Born</p>
                    <p className="font-medium">{formatDate(bio.birth_date)}</p>
                  </div>
                </div>
              )}
              {bio.nationality && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{bio.nationality}</p>
                  </div>
                </div>
              )}
              {bio.occupation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">
                      {Array.isArray(bio.occupation) ? bio.occupation.join(', ') : bio.occupation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biography */}
      {profile.long_description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Biography</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{profile.long_description}</p>
          </CardContent>
        </Card>
      )}

      {/* Books Section */}
      {profile.profile_books && profile.profile_books.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Book className="h-5 w-5" />
              Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {profile.profile_books.map((pb: any) => (
                <Link 
                  key={pb.book?.id} 
                  to={`/public/profiles/${profile.slug}/books/${pb.book?.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-2/3 bg-muted flex items-center justify-center">
                      {pb.book?.cover_image_url ? (
                        <img 
                          src={pb.book.cover_image_url} 
                          alt={pb.book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Book className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {pb.book?.title}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifelines */}
      {lifelinesData && lifelinesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Lifelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lifelinesData.map((lifeline: any) => (
                <Link 
                  key={lifeline.id}
                  to={`/public/collections/prof-g-media/lifelines/${lifeline.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex gap-4 p-4">
                      <div className="h-16 w-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                        {lifeline.cover_image?.url ? (
                          <img 
                            src={lifeline.cover_image.url} 
                            alt={lifeline.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {lifeline.title}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {lifeline.relationship_type || lifeline.lifeline_type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Awards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {awards.map((award: any) => (
                <div key={award.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{award.category}</p>
                    {award.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{award.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotes */}
      {quotes && quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5" />
              Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotes.slice(0, 3).map((quote: any) => (
                <blockquote key={quote.id} className="border-l-4 border-primary/30 pl-4 italic">
                  <p className="text-muted-foreground">"{quote.quote}"</p>
                  {quote.context && (
                    <footer className="text-sm mt-2 text-muted-foreground/70">
                      — {quote.context}
                    </footer>
                  )}
                </blockquote>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// LAYOUT B: MAGAZINE STYLE
// ============================================
function MagazineLayout({ profile, lifelinesData, awards, quotes }: LayoutProps) {
  const avatarUrl = profile.avatar_image?.url || profile.avatar_url;
  const bio = profile.extended_data?.biographical;
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Section - Magazine Style with larger image */}
      <div className="relative">
        <div className="h-48 sm:h-64 bg-linear-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl overflow-hidden">
          {avatarUrl && (
            <div className="absolute inset-0 opacity-10">
              <img 
                src={avatarUrl} 
                alt=""
                className="w-full h-full object-cover blur-2xl"
              />
            </div>
          )}
        </div>
        <div className="absolute -bottom-16 left-6 sm:left-12 flex items-end gap-6">
          <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-xl">
            <AvatarImage src={avatarUrl} alt={profile.name} />
            <AvatarFallback className="text-3xl">{getInitials(profile.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <div className="pt-20 sm:pt-16 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{profile.name}</h1>
            {profile.short_description && (
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                {profile.short_description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge className="h-8 px-4">{profile.subject_type}</Badge>
          </div>
        </div>

        {/* Quick Facts - Horizontal Pills */}
        {bio && (
          <div className="flex flex-wrap gap-3 mt-6">
            {bio.birth_date && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(bio.birth_date)}</span>
              </div>
            )}
            {bio.nationality && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{bio.nationality}</span>
              </div>
            )}
            {bio.occupation && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {Array.isArray(bio.occupation) ? bio.occupation[0] : bio.occupation}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Biography - Magazine style with drop cap */}
      {profile.long_description && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-8">
            <p className="text-lg leading-relaxed text-muted-foreground first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-primary">
              {profile.long_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Books + Lifelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Books Column */}
        {profile.profile_books && profile.profile_books.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Published Works
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {profile.profile_books.map((pb: any, index: number) => (
                  <Link 
                    key={pb.book?.id} 
                    to={`/public/profiles/${profile.slug}/books/${pb.book?.slug}`}
                    className="group block"
                  >
                    <div className={`flex gap-4 ${index !== 0 ? 'pt-4 border-t' : ''}`}>
                      <div className="h-24 w-16 rounded-lg bg-muted shrink-0 overflow-hidden shadow-md">
                        {pb.book?.cover_image_url ? (
                          <img 
                            src={pb.book.cover_image_url} 
                            alt={pb.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold group-hover:text-primary transition-colors">
                          {pb.book?.title}
                        </p>
                        {pb.book?.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {pb.book.subtitle}
                          </p>
                        )}
                        {pb.book?.publication_year && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {pb.book.publication_year}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lifelines Column */}
        {lifelinesData && lifelinesData.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Lifelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {lifelinesData.map((lifeline: any, index: number) => (
                  <Link 
                    key={lifeline.id}
                    to={`/public/collections/prof-g-media/lifelines/${lifeline.slug}`}
                    className="group block"
                  >
                    <div className={`flex gap-4 ${index !== 0 ? 'pt-4 border-t' : ''}`}>
                      <div className="h-16 w-16 rounded-xl bg-muted shrink-0 overflow-hidden shadow-md">
                        {lifeline.cover_image?.url ? (
                          <img 
                            src={lifeline.cover_image.url} 
                            alt={lifeline.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
                            <Sparkles className="h-6 w-6 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {lifeline.title}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {lifeline.relationship_type || lifeline.lifeline_type}
                        </Badge>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Awards - Horizontal Scroll */}
      {awards && awards.length > 0 && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Recognition & Awards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="flex gap-4 p-6">
                {awards.map((award: any) => (
                  <Card key={award.id} className="min-w-[280px] bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/50 dark:border-amber-700/30">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 dark:text-amber-100">
                            {award.category}
                          </p>
                          {award.notes && (
                            <p className="text-sm text-amber-700/80 dark:text-amber-300/70 mt-1 line-clamp-2">
                              {award.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Featured Quote - Large format */}
      {quotes && quotes.length > 0 && (
        <Card className="border-0 shadow-lg bg-linear-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 sm:p-12">
            <Quote className="h-12 w-12 text-primary/30 mb-4" />
            <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed">
              "{quotes[0].quote}"
            </blockquote>
            {quotes[0].context && (
              <footer className="mt-6 text-muted-foreground">
                — {quotes[0].context}
              </footer>
            )}
            {quotes.length > 1 && (
              <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-4">More quotes</p>
                <div className="space-y-3">
                  {quotes.slice(1, 4).map((quote: any) => (
                    <p key={quote.id} className="text-muted-foreground italic">
                      "{quote.quote}"
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// LAYOUT C: COMPACT / MOBILE-FIRST
// ============================================
function CompactLayout({ profile, lifelinesData, awards, quotes }: LayoutProps) {
  const [openSections, setOpenSections] = useState<string[]>(['bio', 'books']);
  const avatarUrl = profile.avatar_image?.url || profile.avatar_url;
  const bio = profile.extended_data?.biographical;

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };
  
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Compact Hero - Horizontal layout */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage src={avatarUrl} alt={profile.name} />
              <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">{profile.subject_type}</Badge>
                {bio?.nationality && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {bio.nationality}
                  </span>
                )}
              </div>
              {profile.short_description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {profile.short_description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-2xl font-bold text-primary">
              {profile.profile_books?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Books</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-2xl font-bold text-primary">
              {lifelinesData?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Lifelines</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-2xl font-bold text-amber-500">
              {awards?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Awards</p>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Biography */}
      {profile.long_description && (
        <Collapsible 
          open={openSections.includes('bio')} 
          onOpenChange={() => toggleSection('bio')}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    About
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('bio') ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.long_description}
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Books - Horizontal Scroll Strip */}
      {profile.profile_books && profile.profile_books.length > 0 && (
        <Collapsible 
          open={openSections.includes('books')} 
          onOpenChange={() => toggleSection('books')}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Books ({profile.profile_books.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('books') ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-0">
                <ScrollArea className="w-full">
                  <div className="flex gap-3 px-4 pb-4">
                    {profile.profile_books.map((pb: any) => (
                      <Link 
                        key={pb.book?.id} 
                        to={`/public/profiles/${profile.slug}/books/${pb.book?.slug}`}
                        className="group shrink-0"
                      >
                        <div className="w-24">
                          <div className="aspect-2/3 rounded-lg bg-muted overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                            {pb.book?.cover_image_url ? (
                              <img 
                                src={pb.book.cover_image_url} 
                                alt={pb.book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Book className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {pb.book?.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Lifelines - Collapsible List */}
      {lifelinesData && lifelinesData.length > 0 && (
        <Collapsible 
          open={openSections.includes('lifelines')} 
          onOpenChange={() => toggleSection('lifelines')}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Lifelines ({lifelinesData.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('lifelines') ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2">
                {lifelinesData.map((lifeline: any) => (
                  <Link 
                    key={lifeline.id}
                    to={`/public/collections/prof-g-media/lifelines/${lifeline.slug}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {lifeline.cover_image?.url ? (
                          <img 
                            src={lifeline.cover_image.url} 
                            alt={lifeline.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lifeline.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lifeline.relationship_type || lifeline.lifeline_type}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Awards - Compact List */}
      {awards && awards.length > 0 && (
        <Collapsible 
          open={openSections.includes('awards')} 
          onOpenChange={() => toggleSection('awards')}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Awards ({awards.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('awards') ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2">
                {awards.map((award: any) => (
                  <div key={award.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                    <Award className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{award.category}</p>
                      {award.notes && (
                        <p className="text-xs text-muted-foreground truncate">{award.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Quotes - Compact */}
      {quotes && quotes.length > 0 && (
        <Collapsible 
          open={openSections.includes('quotes')} 
          onOpenChange={() => toggleSection('quotes')}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4" />
                    Quotes ({quotes.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('quotes') ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {quotes.slice(0, 5).map((quote: any) => (
                  <div key={quote.id} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-sm italic text-muted-foreground line-clamp-3">
                      "{quote.quote}"
                    </p>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

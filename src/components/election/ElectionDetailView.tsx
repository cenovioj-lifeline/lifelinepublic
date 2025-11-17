import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Award, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useNavigate } from "react-router-dom";

interface ElectionDetailViewProps {
  election: any;
  groupedResults: Array<{ category: string; results: any[] }>;
  collectionContext?: {
    slug: string;
    title?: string;
  };
}

export function ElectionDetailView({ election, groupedResults, collectionContext }: ElectionDetailViewProps) {
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleBack = () => {
    if (collectionContext) {
      navigate(`/c/${collectionContext.slug}/elections`);
    } else {
      navigate("/public/elections");
    }
  };

  const handleProfileClick = (profileSlug: string) => {
    if (collectionContext) {
      navigate(`/c/${collectionContext.slug}/profile/${profileSlug}`);
    } else {
      navigate(`/public/profile/${profileSlug}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes("best") || lower.includes("award")) return <Award className="h-5 w-5" />;
    if (lower.includes("most")) return <Sparkles className="h-5 w-5" />;
    return <Trophy className="h-5 w-5" />;
  };

  if (!election) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {collectionContext ? collectionContext.title || "Collection" : "Elections"}
            </Button>
            <FavoriteButton itemId={election.id} itemType="election" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{election.title}</h1>
          {election.description && (
            <p className="text-muted-foreground mb-3">{election.description}</p>
          )}
          {election.election_tags && election.election_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {election.election_tags.map((tag: any) => (
                <Badge key={tag.tags.name} variant="secondary">
                  {tag.tags.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {groupedResults.map(({ category, results }) => (
          <Collapsible
            key={category}
            open={openCategories[category] ?? true}
            onOpenChange={() => toggleCategory(category)}
          >
            <Card className="overflow-hidden bg-card border-border">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-primary">
                      {getCategoryIcon(category)}
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{category}</h2>
                    <Badge variant="secondary" className="ml-2">
                      {results.length} {results.length === 1 ? 'award' : 'awards'}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openCategories[category] ?? true ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-border">
                  {results.map((result) => (
                    <CardContent key={result.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-3">
                            {result.category}
                          </h3>
                          {result.profiles && result.profiles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              {result.profiles.map((profile: any) => (
                                <button
                                  key={profile.id}
                                  onClick={() => handleProfileClick(profile.slug)}
                                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                                >
                                  <Avatar className="h-10 w-10 border-2 border-primary">
                                    <AvatarImage 
                                      src={profile.avatar?.url} 
                                      alt={profile.name}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                      {profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground hover:text-primary transition-colors">
                                    {profile.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {result.winner_name && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Winner: <span className="font-medium text-foreground">{result.winner_name}</span>
                            </p>
                          )}
                          {result.notes && (
                            <p className="text-sm text-muted-foreground italic mb-2">
                              {result.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {result.vote_count && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {result.vote_count.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">votes</div>
                            </div>
                          )}
                          {result.percentage && (
                            <Badge variant="secondary" className="text-sm">
                              {result.percentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

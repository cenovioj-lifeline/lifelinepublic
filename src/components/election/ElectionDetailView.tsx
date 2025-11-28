import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Award, Sparkles, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
            <div className="sticky top-0 z-10 shadow-sm">
                {/* Top bar with title and back button - Themed Background */}
                <div className="bg-[hsl(var(--scheme-award-bg))] border-b border-[hsl(var(--scheme-award-border))] px-4 py-4">
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="gap-2 text-[hsl(var(--scheme-title-text))] hover:bg-[hsl(var(--scheme-award-border)/.2)]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to {collectionContext ? collectionContext.title || "Collection" : "Elections"}
                            </Button>
                            <FavoriteButton itemId={election.id} itemType="election" />
                        </div>
                        <h1 className="text-3xl font-bold text-[hsl(var(--scheme-title-text))] mb-2">{election.title}</h1>
                    </div>
                </div>

                {/* Description bar - White Background */}
                <div className="bg-background border-b border-border px-4 py-4">
                    <div className="container mx-auto">
                        {election.description && (
                            <p className="text-foreground opacity-80 mb-3">{election.description}</p>
                        )}
                        {election.election_tags && election.election_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {election.election_tags.map((tag: any) => (
                                    <Badge key={tag.tags.name} variant="secondary" className="bg-secondary text-secondary-foreground">
                                        {tag.tags.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="container mx-auto px-4 py-8 space-y-6">
                {groupedResults.map(({ category, results }) => (
                    <Collapsible
                        key={category}
                        open={openCategories[category] ?? false}
                        onOpenChange={() => toggleCategory(category)}
                    >
                        <Card className="overflow-hidden bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]">
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-6 hover:bg-[hsl(var(--scheme-cards-border)/.1)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[hsl(var(--scheme-nav-button))]">
                                            {getCategoryIcon(category)}
                                        </div>
                                        <h2 className="text-xl font-semibold text-[hsl(var(--scheme-cards-text))]">{category}</h2>
                                        <Badge variant="secondary" className="ml-2 bg-[hsl(var(--scheme-nav-button))] text-[hsl(var(--scheme-nav-text))]">
                                            {results.length} {results.length === 1 ? 'award' : 'awards'}
                                        </Badge>
                                    </div>
                                    <ChevronDown
                                        className={`h-5 w-5 text-[hsl(var(--scheme-cards-text))] opacity-50 transition-transform ${openCategories[category] ? 'transform rotate-180' : ''
                                            }`}
                                    />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="divide-y divide-[hsl(var(--scheme-cards-border))]">
                                    {results.map((result) => (
                                        <CardContent key={result.id} className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-[hsl(var(--scheme-cards-text))] mb-3">
                                                        {result.category}
                                                    </h3>
                                                    {result.profiles && result.profiles.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                                            {result.profiles.map((profile: any) => (
                                                                <button
                                                                    key={profile.id}
                                                                    onClick={() => handleProfileClick(profile.slug)}
                                                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--scheme-cards-border)/.1)] transition-colors"
                                                                >
                                                                    <Avatar className="h-10 w-10 border-2 border-[hsl(var(--scheme-nav-button))]">
                                                                        <AvatarImage
                                                                            src={profile.avatar?.url}
                                                                            alt={profile.name}
                                                                        />
                                                                        <AvatarFallback className="bg-[hsl(var(--scheme-nav-button)/.1)] text-[hsl(var(--scheme-nav-button))] font-semibold">
                                                                            {profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-medium text-[hsl(var(--scheme-cards-text))] hover:text-[hsl(var(--scheme-nav-button))] transition-colors">
                                                                        {profile.name}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {result.winner_name && (
                                                        <p className="text-sm text-[hsl(var(--scheme-cards-text))] opacity-80 mb-2">
                                                            Winner: <span className="font-medium text-[hsl(var(--scheme-cards-text))]">{result.winner_name}</span>
                                                        </p>
                                                    )}
                                                    {result.notes && (
                                                        <p className="text-sm text-[hsl(var(--scheme-cards-text))] opacity-70 italic mb-2">
                                                            {result.notes}
                                                        </p>
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

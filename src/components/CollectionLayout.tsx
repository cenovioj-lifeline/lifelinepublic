import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Users, ArrowLeft, Settings, Share2, Award, BookOpen, Menu, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PublicUserMenu } from "@/components/PublicUserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { CollectionQuotePopup } from "@/components/CollectionQuotePopup";
import { CollectionShareModal } from "@/components/CollectionShareModal";
import { useCollectionQuote } from "@/hooks/useCollectionQuote";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CollectionLayoutProps {
  children: React.ReactNode;
  collectionTitle: string;
  collectionSlug: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  webPrimary?: string | null;
  webSecondary?: string | null;
  menuTextColor?: string | null;
  menuHoverColor?: string | null;
  menuActiveColor?: string | null;
  collectionBgColor?: string | null;
  collectionTextColor?: string | null;
  collectionHeadingColor?: string | null;
  collectionAccentColor?: string | null;
  collectionCardBg?: string | null;
  collectionBorderColor?: string | null;
  collectionMutedText?: string | null;
  collectionBadgeColor?: string | null;
}

export function CollectionLayout({
  children,
  collectionTitle,
  collectionSlug,
  primaryColor,
  secondaryColor,
  webPrimary,
  webSecondary,
  menuTextColor,
  menuHoverColor,
  menuActiveColor,
  collectionBgColor,
  collectionTextColor,
  collectionHeadingColor,
  collectionAccentColor,
  collectionCardBg,
  collectionBorderColor,
  collectionMutedText,
  collectionBadgeColor,
}: CollectionLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Calculate smart defaults for menu colors
  const getMenuTextColor = () => {
    if (menuTextColor) return menuTextColor;
    if (webPrimary) {
      const luminance = getLuminance(webPrimary);
      return luminance < 0.5 ? "#ffffff" : "#1f2937";
    }
    return undefined;
  };

  const getMenuHoverColor = () => {
    if (menuHoverColor) return menuHoverColor;
    const textColor = getMenuTextColor();
    if (textColor === "#ffffff") return "rgba(255, 255, 255, 0.1)";
    if (textColor === "#1f2937") return "rgba(31, 41, 55, 0.1)";
    return undefined;
  };

  const getMenuActiveColor = () => {
    if (menuActiveColor) return menuActiveColor;
    const textColor = getMenuTextColor();
    if (textColor === "#ffffff") return "rgba(255, 255, 255, 0.2)";
    if (textColor === "#1f2937") return "rgba(31, 41, 55, 0.2)";
    return undefined;
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Fetch collection settings for quotes
  const { data: collectionSettings } = useQuery({
    queryKey: ["collection-settings", collectionSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, quotes_enabled, quote_frequency")
        .eq("slug", collectionSlug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Use the quote hook
  const { currentQuote, dismissQuote } = useCollectionQuote(
    collectionSettings?.id || "",
    collectionSettings?.quotes_enabled ?? true,
    collectionSettings?.quote_frequency || 1
  );

  // Apply custom colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Lifeline timeline colors
    if (primaryColor) {
      const hsl = hexToHSL(primaryColor);
      root.style.setProperty('--collection-primary', hsl);
    }
    
    if (secondaryColor) {
      const hsl = hexToHSL(secondaryColor);
      root.style.setProperty('--collection-secondary', hsl);
    }

    // Page-wide collection colors
    if (collectionBgColor) {
      const hsl = hexToHSL(collectionBgColor);
      root.style.setProperty('--background', hsl);
    }

    if (collectionTextColor) {
      const hsl = hexToHSL(collectionTextColor);
      root.style.setProperty('--foreground', hsl);
    }

    // Use collectionHeadingColor if available, otherwise fall back to webPrimary
    const primaryColorSource = collectionHeadingColor || webPrimary;
    if (primaryColorSource) {
      const hsl = hexToHSL(primaryColorSource);
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
    }

    if (collectionAccentColor) {
      const hsl = hexToHSL(collectionAccentColor);
      root.style.setProperty('--accent', hsl);
    }

    if (collectionCardBg) {
      const hsl = hexToHSL(collectionCardBg);
      root.style.setProperty('--card', hsl);
    }

    if (collectionBorderColor) {
      const hsl = hexToHSL(collectionBorderColor);
      root.style.setProperty('--border', hsl);
    }

    if (collectionMutedText) {
      const hsl = hexToHSL(collectionMutedText);
      root.style.setProperty('--muted-foreground', hsl);
    }

    if (collectionBadgeColor) {
      const hsl = hexToHSL(collectionBadgeColor);
      root.style.setProperty('--secondary', hsl);
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--collection-primary');
      root.style.removeProperty('--collection-secondary');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--card');
      root.style.removeProperty('--border');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--ring');
    };
  }, [primaryColor, secondaryColor, collectionBgColor, collectionTextColor, collectionHeadingColor, collectionAccentColor, collectionCardBg, collectionBorderColor, collectionMutedText, collectionBadgeColor, webPrimary]);

  const handleExit = () => {
    navigate("/");
  };

  // Fetch the first election for direct navigation
  const { data: firstElection } = useQuery({
    queryKey: ["collection-first-election", collectionSlug],
    queryFn: async () => {
      const { data: collectionData } = await supabase
        .from("collections")
        .select("id")
        .eq("slug", collectionSlug)
        .single();

      if (!collectionData?.id) return null;

      const { data, error } = await supabase
        .from("mock_elections")
        .select("slug")
        .eq("collection_id", collectionData.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    },
  });

  const navItems = [
    { label: "Home", icon: Home, to: `/public/collections/${collectionSlug}` },
    { label: "Stories", icon: BookOpen, to: `/public/collections/${collectionSlug}/lifelines` },
    { label: "People", icon: Users, to: `/public/collections/${collectionSlug}/profiles` },
    { 
      label: "Awards", 
      icon: Award, 
      to: firstElection 
        ? `/public/collections/${collectionSlug}/elections/${firstElection.slug}`
        : `/public/collections/${collectionSlug}/elections`
    },
  ];

  const actionItems: Array<{ label: string; icon: any; action?: () => void; to?: string }> = [
    { label: "More", icon: MoreHorizontal, to: `/public/collections/${collectionSlug}/more` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header 
        className="border-b sticky top-0 z-50 shadow-sm"
        style={{
          backgroundColor: webPrimary || undefined,
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                to={`/public/collections/${collectionSlug}`}
                className="text-lg md:text-xl font-bold"
                style={{
                  color: webSecondary || (webPrimary ? "#ffffff" : undefined),
                }}
              >
                {collectionTitle}
              </Link>
              
              {!isMobile && (
                <div className="flex items-center gap-2">
                  {navItems.map((item) => {
                    const isActive = isActiveRoute(item.to);
                    return (
                      <Button
                        key={item.label}
                        variant="ghost"
                        size="sm"
                        asChild
                        className="gap-2 transition-colors"
                        style={{
                          color: getMenuTextColor(),
                          backgroundColor: isActive ? getMenuActiveColor() : undefined,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = getMenuHoverColor() || "";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "";
                          }
                        }}
                      >
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                  {actionItems.map((item) =>
                    item.to ? (
                      <Button
                        key={item.label}
                        variant="ghost"
                        size="sm"
                        asChild
                        className="gap-2 transition-colors"
                        style={{
                          color: getMenuTextColor(),
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = getMenuHoverColor() || "";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        key={item.label}
                        variant="ghost"
                        size="sm"
                        onClick={item.action}
                        className="gap-2 transition-colors"
                        style={{
                          color: getMenuTextColor(),
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = getMenuHoverColor() || "";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExit}
                    className="gap-2 transition-colors"
                    style={{
                      color: getMenuTextColor(),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getMenuHoverColor() || "";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    LP
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isMobile && user && <PublicUserMenu />}
              
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      style={{
                        color: webSecondary || (webPrimary ? "#ffffff" : undefined),
                      }}
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-4">
                      <h2 className="text-lg font-bold mt-2">{collectionTitle}</h2>
                      <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                          <Button
                            key={item.label}
                            variant="ghost"
                            onClick={() => {
                              navigate(item.to);
                              setMobileMenuOpen(false);
                            }}
                            className="gap-2 justify-start"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        ))}
                        {actionItems.map((item) => (
                          <Button
                            key={item.label}
                            variant="ghost"
                            onClick={() => {
                              if (item.action) {
                                item.action();
                              } else if (item.to) {
                                navigate(item.to);
                              }
                              setMobileMenuOpen(false);
                            }}
                            className="gap-2 justify-start"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleExit();
                            setMobileMenuOpen(false);
                          }}
                          className="gap-2 justify-start mt-4"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to Lifeline Public
                        </Button>
                        {user && (
                          <div className="mt-4 pt-4 border-t">
                            <PublicUserMenu />
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 md:py-8">
        {children}
        {currentQuote && (
          <CollectionQuotePopup
            quote={currentQuote.quote}
            author={currentQuote.author}
            context={currentQuote.context}
            onDismiss={dismissQuote}
          />
        )}
      </main>
      
      <CollectionShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        collectionSlug={collectionSlug}
        collectionTitle={collectionTitle}
      />
    </div>
  );
}

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Helper function to calculate luminance from hex color
function getLuminance(hex: string): number {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const srgb = [r, g, b].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

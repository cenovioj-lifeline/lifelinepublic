import { useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { Home, Users, ArrowLeft, Award, Menu, MoreHorizontal, Play, Loader2 } from "lucide-react";
import { LifelineBookIcon } from "@/components/icons/LifelineBookIcon";
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
import { useColorScheme } from "@/hooks/useColorScheme";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { getBackNavigation, isDetailPage } from "@/lib/backNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CollectionLayoutProps {
  children: React.ReactNode;
  collectionTitle: string;
  collectionSlug: string;
  collectionId?: string;
}

export function CollectionLayout({
  children,
  collectionTitle,
  collectionSlug,
  collectionId,
}: CollectionLayoutProps) {
  const { colorScheme, isLoading: colorsLoading } = useColorScheme(collectionId);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Parse search params for referrer tracking
  const searchParams = new URLSearchParams(location.search);

  // Determine if we're on a detail page and get back navigation info
  const isOnDetailPage = isDetailPage(location.pathname);
  const backNav = getBackNavigation(location.pathname, params, searchParams);

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Fetch collection settings for quotes and media_enabled
  const { data: collectionSettings } = useQuery({
    queryKey: ["collection-settings", collectionSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, quotes_enabled, quote_frequency, media_enabled")
        .eq("slug", collectionSlug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const mediaEnabled = (collectionSettings as any)?.media_enabled ?? false;

  // Use the quote hook
  const { currentQuote, dismissQuote } = useCollectionQuote(
    collectionSettings?.id || "",
    collectionSettings?.quotes_enabled ?? true,
    collectionSettings?.quote_frequency || 1
  );

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
        .maybeSingle();

      if (error) return null;
      return data;
    },
  });
  
  // Block render until color scheme is loaded to prevent color "blip"
  // IMPORTANT: This must come AFTER all hooks to avoid React error #310
  if (colorsLoading || !colorScheme) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Build nav items based on media_enabled
  const navItems = [
    { label: "Home", icon: Home, to: `/public/collections/${collectionSlug}` },
    { label: "Stories", icon: LifelineBookIcon, to: `/public/collections/${collectionSlug}/lifelines` },
    { label: "Profiles", icon: Users, to: `/public/collections/${collectionSlug}/profiles` },
    // Conditionally add Media or Awards
    ...(mediaEnabled
      ? [{ label: "Media", icon: Play, to: `/public/collections/${collectionSlug}/media` }]
      : [{
          label: "Awards",
          icon: Award,
          to: firstElection
            ? `/public/collections/${collectionSlug}/elections/${firstElection.slug}`
            : `/public/collections/${collectionSlug}/elections`
        }]
    ),
  ];

  const actionItems: Array<{ label: string; icon: any; action?: () => void; to?: string }> = [
    { label: "More", icon: MoreHorizontal, to: `/public/collections/${collectionSlug}/more` },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--scheme-collection-bg))" }}>
      <header
        className="border-b sticky top-0 z-50 shadow-sm bg-[hsl(var(--scheme-nav-bg))] border-[hsl(var(--scheme-nav-bg)/.8)]"
      >
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Desktop back button for detail pages */}
              {!isMobile && isOnDetailPage && backNav && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(backNav.parentPath)}
                  className="gap-2 text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to {backNav.parentLabel}
                </Button>
              )}
              
              <Link
                to={`/public/collections/${collectionSlug}`}
                className="text-lg md:text-xl font-bold text-[hsl(var(--scheme-nav-text))] hover:opacity-80 transition-opacity"
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
                        className={cn(
                          "gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button))]",
                          isActive && "bg-[hsl(var(--scheme-nav-button))] font-bold"
                        )}
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
                        className="gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]"
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
                        className="gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]"
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
                    className="gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    LP
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isMobile && user && (
                <>
                  <NotificationBell />
                  <PublicUserMenu />
                </>
              )}
              
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]"
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
                            <div className="flex items-center gap-3 px-2 py-2">
                              <Avatar className="h-10 w-10 ring-2 ring-gray-600 ring-offset-2">
                                <AvatarFallback className="bg-gray-200 text-gray-700 font-medium">
                                  {user.email?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">Profile</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <PublicUserMenu />
                            </div>
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
      <main className="container mx-auto px-4" style={{ paddingTop: 'var(--content-section-gap)', paddingBottom: 'var(--content-section-gap)' }}>
        {children}
        {/* Show legacy quote popup only on non-mobile */}
        {currentQuote && !isMobile && (
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

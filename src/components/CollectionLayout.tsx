import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Users, ArrowLeft, Award, BookOpen, Menu, MoreHorizontal } from "lucide-react";
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
  useColorScheme(collectionId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const isMobile = useIsMobile();

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
        className="border-b sticky top-0 z-50 shadow-sm bg-[hsl(var(--scheme-nav-bg))] border-[hsl(var(--scheme-nav-bg)/.8)]"
      >
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-6">
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
      <main className="container mx-auto px-4 py-2 lg:py-6 md:py-4">
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

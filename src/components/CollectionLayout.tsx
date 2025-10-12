import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Rss, Users, Vote, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PublicUserMenu } from "@/components/PublicUserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface CollectionLayoutProps {
  children: React.ReactNode;
  collectionTitle: string;
  collectionSlug: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  webPrimary?: string | null;
  webSecondary?: string | null;
}

export function CollectionLayout({
  children,
  collectionTitle,
  collectionSlug,
  primaryColor,
  secondaryColor,
  webPrimary,
  webSecondary,
}: CollectionLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Apply custom colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    if (primaryColor) {
      // Convert hex to HSL for CSS variables
      const hsl = hexToHSL(primaryColor);
      root.style.setProperty('--collection-primary', hsl);
    }
    
    if (secondaryColor) {
      const hsl = hexToHSL(secondaryColor);
      root.style.setProperty('--collection-secondary', hsl);
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--collection-primary');
      root.style.removeProperty('--collection-secondary');
    };
  }, [primaryColor, secondaryColor]);

  const handleExit = () => {
    navigate("/public/collections");
  };

  const navItems = [
    { label: "Home", icon: Home, to: `/public/collections/${collectionSlug}` },
    { label: "Feed", icon: Rss, to: `/public/collections/${collectionSlug}/feed` },
    { label: "Lifelines", icon: Users, to: `/public/collections/${collectionSlug}/lifelines` },
    { label: "Profiles", icon: Users, to: `/public/collections/${collectionSlug}/profiles` },
    { label: "MER", icon: Vote, to: `/public/collections/${collectionSlug}/elections` },
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
                  {navItems.map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-2"
                      style={{
                        color: webPrimary ? "#ffffff" : undefined,
                      }}
                    >
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExit}
                    className="gap-2"
                    style={{
                      color: webPrimary ? "#ffffff" : undefined,
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    LP
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user && <PublicUserMenu />}
              
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      style={{
                        color: webPrimary ? "#ffffff" : undefined,
                      }}
                    >
                      <Home className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-2 mt-8">
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
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
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

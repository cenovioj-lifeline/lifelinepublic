import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, Award, FolderOpen, Menu, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { PublicUserMenu } from "@/components/PublicUserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";
import { useColorScheme } from "@/hooks/useColorScheme";
import { cn } from "@/lib/utils";
import { LifelineBookIcon } from "@/components/icons/LifelineBookIcon";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  useColorScheme(); // Apply default color scheme
  const location = useLocation();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/public/collections", label: "Collections", icon: FolderOpen },
    { path: "/public/lifelines", label: "Stories", icon: LifelineBookIcon },
    { path: "/public/profiles", label: "Profiles", icon: Users },
    { path: "/public/elections", label: "Awards", icon: Award },
    { path: "/public/more", label: "More", icon: MoreHorizontal },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button))]",
              isActive && "bg-[hsl(var(--scheme-nav-button))] font-bold"
            )}
          >
            <Link to={item.path} onClick={onClick}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-[hsl(var(--scheme-nav-bg))] border-[hsl(var(--scheme-nav-bg)/.8)]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center text-lg md:text-xl font-bold text-[hsl(var(--scheme-nav-text))] hover:opacity-80 transition-opacity">
              <img src={logo} alt="Lifeline Public" className="h-10 mr-2" />
              
            </Link>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex gap-2 items-center">
                <NavLinks />
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-2 transition-colors text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button))]"
                >
                  <Link to="/">
                    <span>LP</span>
                  </Link>
                </Button>
                {user ? (
                  <>
                    <NotificationBell />
                    <PublicUserMenu />
                  </>
                ) : (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuthModalOpen(true)}
                    className="ml-2 text-[hsl(var(--scheme-nav-text))] hover:bg-[hsl(var(--scheme-nav-button))]"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Navigation */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.2)]">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 bg-[hsl(var(--scheme-nav-bg))]">
                  <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold mt-2 text-[hsl(var(--scheme-nav-text))]">Lifeline Public</h2>
                    <div className="flex flex-col gap-2">
                      <NavLinks onClick={() => setMobileMenuOpen(false)} />
                      {user ? (
                        <div className="mt-4 pt-4 border-t">
                          <PublicUserMenu />
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => {
                            setAuthModalOpen(true);
                            setMobileMenuOpen(false);
                          }}
                        >
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4" style={{ paddingTop: 'var(--content-section-gap)', paddingBottom: 'var(--content-section-gap)' }}>{children}</main>
      <PublicAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

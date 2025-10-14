import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Users, Vote, FolderOpen, Menu, Lock, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { PublicUserMenu } from "@/components/PublicUserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/public/lifelines", label: "Lifelines", icon: FileText },
    { path: "/public/collections", label: "Collections", icon: FolderOpen },
    { path: "/public/profiles", label: "Profiles", icon: Users },
    { path: "/public/elections", label: "Elections", icon: Vote },
    { path: "/top-contributors", label: "Contributors", icon: Trophy },
    { path: "/admin/login", label: "Admin", icon: Lock },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="text-lg md:text-xl font-bold text-primary">
              Lifeline Public
            </Link>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex gap-2 items-center">
                <NavLinks />
                {user ? (
                  <PublicUserMenu />
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Navigation */}
            {isMobile && (
              <div className="flex items-center gap-2">
                {user ? (
                  <PublicUserMenu />
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign In
                  </Button>
                )}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-2 mt-8">
                      <NavLinks onClick={() => setMobileMenuOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
      <PublicAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

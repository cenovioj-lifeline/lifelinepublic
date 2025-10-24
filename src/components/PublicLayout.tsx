import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Users, Award, FolderOpen, Menu, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { PublicUserMenu } from "@/components/PublicUserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/public/lifelines", label: "Stories", icon: BookOpen },
    { path: "/public/profiles", label: "People", icon: Users },
    { path: "/public/elections", label: "Awards", icon: Award },
    { path: "/public/collections", label: "Collections", icon: FolderOpen },
    { path: "/public/more", label: "More", icon: MoreHorizontal },
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
                ? "bg-[#ff6b35] text-white"
                : "text-white hover:bg-[#ff6b35]"
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
      <header className="border-b sticky top-0 z-50" style={{ backgroundColor: "#1e3a5f" }}>
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Lifeline Public" className="h-10" />
            </Link>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex gap-1 items-center">
                <NavLinks />
                <Link
                  to="/admin/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-white hover:bg-[#ff6b35]"
                >
                  <span>LP</span>
                </Link>
                {user ? (
                  <>
                    <NotificationBell />
                    <PublicUserMenu />
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAuthModalOpen(true)}
                    className="ml-2 border-white text-white hover:bg-white hover:text-[#1e3a5f]"
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
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold mt-2">Lifeline Public</h2>
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
      <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
      <PublicAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

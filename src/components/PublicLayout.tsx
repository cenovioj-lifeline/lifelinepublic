import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Users, Vote, FolderOpen } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: "/home", label: "Home", icon: Home },
    { path: "/public/lifelines", label: "Lifelines", icon: FileText },
    { path: "/public/collections", label: "Collections", icon: FolderOpen },
    { path: "/public/profiles", label: "Profiles", icon: Users },
    { path: "/public/elections", label: "Elections", icon: Vote },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-6">
            <Link to="/home" className="text-xl font-bold text-primary">
              Lifeline Public
            </Link>
            <div className="flex gap-4 ml-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

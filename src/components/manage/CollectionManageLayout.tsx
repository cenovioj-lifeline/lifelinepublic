import { ReactNode } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCanEditCollection } from "@/hooks/useCanEditCollection";
import { useCollectionRole } from "@/hooks/useCollectionRole";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Users,
  Award,
  Quote,
  Settings,
  UserCog,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { LifelineBookIcon } from "@/components/icons/LifelineBookIcon";

interface CollectionManageLayoutProps {
  children: ReactNode;
}

export function CollectionManageLayout({ children }: CollectionManageLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Fetch collection
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["manage-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Check permissions
  const { canEdit, loading: permissionLoading } = useCanEditCollection(collection?.id);
  const { role, isOwner } = useCollectionRole(collection?.id);

  const isLoading = collectionLoading || permissionLoading;

  // Build nav items
  const navItems = [
    { label: "Overview", icon: LayoutDashboard, to: `/public/collections/${slug}/manage` },
    { label: "Lifelines", icon: LifelineBookIcon, to: `/public/collections/${slug}/manage/lifelines` },
    { label: "Profiles", icon: Users, to: `/public/collections/${slug}/manage/profiles` },
    { label: "Awards", icon: Award, to: `/public/collections/${slug}/manage/mer` },
    { label: "Quotes", icon: Quote, to: `/public/collections/${slug}/manage/quotes` },
    { label: "Settings", icon: Settings, to: `/public/collections/${slug}/manage/settings` },
  ];

  // Only owners can access team management
  if (isOwner) {
    navItems.push({ label: "Team", icon: UserCog, to: `/public/collections/${slug}/manage/team` });
  }

  const isActiveRoute = (path: string) => {
    if (path === `/public/collections/${slug}/manage`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <aside className="w-64 border-r bg-card min-h-screen p-4">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </aside>
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="text-muted-foreground">You must be signed in to manage collections.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  // No permission
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to manage this collection.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate(`/public/collections/${slug}`)}>
              View Collection
            </Button>
            <Button onClick={() => navigate(`/public/collections/${slug}/claim`)}>
              Request Access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-screen sticky top-0">
          <div className="p-4">
            {/* Back link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/public/collections/${slug}`)}
              className="gap-2 mb-4 w-full justify-start text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Collection
            </Button>

            {/* Collection title */}
            <div className="mb-6">
              <h1 className="font-bold text-lg truncate" title={collection?.title}>
                {collection?.title}
              </h1>
              <p className="text-xs text-muted-foreground">Collection Management</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your role: <span className="font-medium capitalize">{role}</span>
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.to);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

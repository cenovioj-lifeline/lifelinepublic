import { Home, Folder, Activity, Users, Award, Tag, Image, LogOut, Settings, Heart, Upload, FileQuestion, Palette, ImagePlus, ArrowLeft, FileBarChart, BookOpen, LayoutGrid, PanelTop } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const items = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Home Manager", url: "/home-manager", icon: Home },
  { title: "Page Builder", url: "/admin/page-builder", icon: PanelTop },
  { title: "Collections", url: "/collections", icon: Folder },
  { title: "Collection Report", url: "/collection-report", icon: FileBarChart },
  { title: "Lifelines", url: "/lifelines", icon: Activity },
  { title: "Image Manager", url: "/lifeline-image-manager", icon: ImagePlus },
  { title: "Profiles", url: "/profiles", icon: Users },
  { title: "Books", url: "/books", icon: BookOpen },
  { title: "MER", fullTitle: "Mock Election Results", url: "/elections", icon: Award },
  { title: "Tags", url: "/tags", icon: Tag },
  { title: "Fan Contributions", url: "/fan-contributions", icon: Heart },
  { title: "User Requests", url: "/user-requests", icon: FileQuestion },
  { title: "Load Lifelines", url: "/load-lifelines", icon: Upload },
  { title: "Color Schemes", url: "/admin/color-schemes", icon: Palette },
  { title: "Action Cards", url: "/admin/action-cards", icon: LayoutGrid },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut } = useAuth();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className="w-60" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold px-4 py-2">
            Lifeline Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.fullTitle ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className="text-sidebar-foreground">
                            <NavLink to={item.url} end className={getNavCls}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.fullTitle}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild className="text-sidebar-foreground">
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="space-y-1">
        <SidebarMenuButton asChild className="text-sidebar-foreground">
          <NavLink to="/" className={getNavCls}>
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Lifeline Public</span>
          </NavLink>
        </SidebarMenuButton>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

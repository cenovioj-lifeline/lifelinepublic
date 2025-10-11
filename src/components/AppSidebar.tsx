import { Home, Folder, Activity, Users, Award, Tag, Image, LogOut } from "lucide-react";
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

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Collections", url: "/collections", icon: Folder },
  { title: "Lifelines", url: "/lifelines", icon: Activity },
  { title: "Profiles", url: "/profiles", icon: Users },
  { title: "Elections", url: "/elections", icon: Award },
  { title: "Tags", url: "/tags", icon: Tag },
  { title: "Media", url: "/media", icon: Image },
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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-sidebar-foreground">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
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

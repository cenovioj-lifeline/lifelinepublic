import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Activity, Users, Award, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: counts } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [collections, lifelines, profiles, elections] = await Promise.all([
        supabase.from("collections").select("id", { count: "exact", head: true }),
        supabase.from("lifelines").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("mock_elections").select("id", { count: "exact", head: true }),
      ]);
      return {
        collections: collections.count || 0,
        lifelines: lifelines.count || 0,
        profiles: profiles.count || 0,
        elections: elections.count || 0,
      };
    },
  });

  const stats = [
    {
      title: "Collections",
      value: counts?.collections ?? "0",
      description: "Themed groups",
      icon: Folder,
      color: "text-primary",
      path: "/collections",
    },
    {
      title: "Lifelines",
      value: counts?.lifelines ?? "0",
      description: "Timeline narratives",
      icon: Activity,
      color: "text-secondary",
      path: "/lifelines",
    },
    {
      title: "Profiles",
      value: counts?.profiles ?? "0",
      description: "People & entities",
      icon: Users,
      color: "text-accent",
      path: "/profiles",
    },
    {
      title: "Elections",
      value: counts?.elections ?? "0",
      description: "Mock elections",
      icon: Award,
      color: "text-primary",
      path: "/elections",
    },
  ];

  const quickActions = [
    { label: "Create Collection", path: "/collections/new", icon: Folder },
    { label: "Add Profile", path: "/profiles/new", icon: Users },
    { label: "Build Lifeline", path: "/lifelines/new", icon: Activity },
    { label: "Create Election", path: "/elections/new", icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the Lifeline Public admin console
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
            onClick={() => navigate(stat.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Start building your Lifeline Public content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate(action.path)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

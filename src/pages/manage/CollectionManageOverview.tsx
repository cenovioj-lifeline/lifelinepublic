import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Users, Award, Quote, ArrowRight, Plus } from "lucide-react";
import { LifelineBookIcon } from "@/components/icons/LifelineBookIcon";

export default function CollectionManageOverview() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch collection with stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["collection-manage-stats", slug],
    queryFn: async () => {
      // Get collection
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("id, title, description")
        .eq("slug", slug)
        .single();

      if (collectionError) throw collectionError;

      // Get counts in parallel
      const [lifelinesRes, profilesRes, entriesRes, quotesRes, electionsRes] = await Promise.all([
        supabase
          .from("lifelines")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collection.id),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("primary_collection_id", collection.id),
        supabase
          .from("entries")
          .select("id, lifeline_id", { count: "exact", head: true })
          .in(
            "lifeline_id",
            (await supabase.from("lifelines").select("id").eq("collection_id", collection.id)).data?.map((l) => l.id) || []
          ),
        supabase
          .from("collection_quotes")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collection.id),
        supabase
          .from("mock_elections")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collection.id),
      ]);

      return {
        collection,
        lifelines: lifelinesRes.count || 0,
        profiles: profilesRes.count || 0,
        entries: entriesRes.count || 0,
        quotes: quotesRes.count || 0,
        elections: electionsRes.count || 0,
      };
    },
    enabled: !!slug,
  });

  const statCards = [
    {
      title: "Lifelines",
      value: stats?.lifelines || 0,
      icon: LifelineBookIcon,
      link: `/public/collections/${slug}/manage/lifelines`,
      color: "text-blue-600",
    },
    {
      title: "Profiles",
      value: stats?.profiles || 0,
      icon: Users,
      link: `/public/collections/${slug}/manage/profiles`,
      color: "text-green-600",
    },
    {
      title: "Entries",
      value: stats?.entries || 0,
      icon: Activity,
      link: `/public/collections/${slug}/manage/lifelines`,
      color: "text-purple-600",
    },
    {
      title: "Quotes",
      value: stats?.quotes || 0,
      icon: Quote,
      link: `/public/collections/${slug}/manage/quotes`,
      color: "text-orange-600",
    },
    {
      title: "Awards",
      value: stats?.elections || 0,
      icon: Award,
      link: `/public/collections/${slug}/manage/mer`,
      color: "text-yellow-600",
    },
  ];

  const quickActions = [
    { label: "Add Lifeline", icon: Plus, link: `/public/collections/${slug}/manage/lifelines?action=new` },
    { label: "Add Profile", icon: Plus, link: `/public/collections/${slug}/manage/profiles?action=new` },
    { label: "Add Quote", icon: Plus, link: `/public/collections/${slug}/manage/quotes?action=new` },
    { label: "Edit Settings", icon: ArrowRight, link: `/public/collections/${slug}/manage/settings` },
  ];

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Manage content for {stats?.collection?.title || "this collection"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat) => (
                <Link key={stat.title} to={stat.link}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button key={action.label} variant="outline" asChild>
                  <Link to={action.link} className="gap-2">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collection Description */}
        {stats?.collection?.description && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{stats.collection.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </CollectionManageLayout>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Activity, Users, Award, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Collections",
    value: "0",
    description: "Themed groups",
    icon: Folder,
    color: "text-primary",
  },
  {
    title: "Lifelines",
    value: "0",
    description: "Timeline narratives",
    icon: Activity,
    color: "text-secondary",
  },
  {
    title: "Profiles",
    value: "0",
    description: "People & entities",
    icon: Users,
    color: "text-accent",
  },
  {
    title: "Elections",
    value: "0",
    description: "Mock elections",
    icon: Award,
    color: "text-primary",
  },
];

export default function Dashboard() {
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
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
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
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Start Guide</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a Collection to group related content</li>
              <li>Add Profiles for people and entities</li>
              <li>Build Lifelines with timeline entries</li>
              <li>Create Mock Elections for engagement</li>
              <li>Organize with Tags and Media</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

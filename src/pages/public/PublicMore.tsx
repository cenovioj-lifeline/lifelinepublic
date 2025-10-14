import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PublicMore() {
  const navigate = useNavigate();

  const features = [
    {
      id: "contributors",
      label: "Contributors",
      icon: Trophy,
      path: "/public/contributors",
      description: "View top contributors",
    },
  ];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">More Features</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Explore additional features and options
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(feature.path)}
            >
              <CardContent className="pt-6 text-center">
                <feature.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium mb-1">{feature.label}</div>
                <div className="text-xs text-muted-foreground">
                  {feature.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

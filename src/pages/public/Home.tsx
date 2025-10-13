import { PublicLayout } from "@/components/PublicLayout";
import { TopContributorsCard } from "@/components/TopContributorsCard";

export default function Home() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Lifeline</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Explore curated collections and lifelines
        </p>
        
        <div className="max-w-md">
          <TopContributorsCard />
        </div>
      </div>
    </PublicLayout>
  );
}

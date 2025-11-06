import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Book, Music, Award } from "lucide-react";

interface ProfileWork {
  id: string;
  work_category: string;
  title: string;
  year?: string;
  work_type?: string;
  significance?: string;
  additional_info?: any;
}

interface ProfileWorksProps {
  works: ProfileWork[];
}

function getWorkIcon(category: string) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('media') || lowerCategory.includes('film') || lowerCategory.includes('tv')) {
    return <Film className="h-4 w-4" />;
  }
  if (lowerCategory.includes('creative') || lowerCategory.includes('book')) {
    return <Book className="h-4 w-4" />;
  }
  if (lowerCategory.includes('music')) {
    return <Music className="h-4 w-4" />;
  }
  return <Award className="h-4 w-4" />;
}

function groupWorks(works: ProfileWork[]) {
  const groups: Record<string, ProfileWork[]> = {};
  
  works.forEach(work => {
    if (!groups[work.work_category]) {
      groups[work.work_category] = [];
    }
    groups[work.work_category].push(work);
  });
  
  return groups;
}

export function ProfileWorks({ works }: ProfileWorksProps) {
  const grouped = groupWorks(works);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Works & Media</h2>
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryWorks]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              {getWorkIcon(category)}
              <h3 className="font-semibold capitalize">
                {category.replace(/_/g, ' ')}
              </h3>
            </div>
            <div className="space-y-3 ml-6">
              {categoryWorks.map((work) => (
                <div key={work.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{work.title}</div>
                      {work.year && (
                        <div className="text-sm text-muted-foreground">
                          {work.year}
                        </div>
                      )}
                      {work.significance && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {work.significance}
                        </p>
                      )}
                    </div>
                    {work.work_type && (
                      <Badge variant="secondary">{work.work_type}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

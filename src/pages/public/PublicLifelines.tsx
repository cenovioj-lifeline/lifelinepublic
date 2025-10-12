import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LifelineViewer } from "@/components/lifeline/LifelineViewer";

export default function PublicLifelines() {
  const [selectedLifelineId, setSelectedLifelineId] = useState<string | null>(null);

  const { data: lifelines } = useQuery({
    queryKey: ["public-lifelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, slug")
        .eq("status", "published")
        .eq("visibility", "public")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lifelines</h1>
      </div>

      <div className="max-w-sm">
        <Select value={selectedLifelineId || ""} onValueChange={setSelectedLifelineId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a lifeline to view" />
          </SelectTrigger>
          <SelectContent>
            {lifelines?.map((lifeline) => (
              <SelectItem key={lifeline.id} value={lifeline.id}>
                {lifeline.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedLifelineId && <LifelineViewer lifelineId={selectedLifelineId} />}
    </div>
  );
}

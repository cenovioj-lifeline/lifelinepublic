import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ImportNewsImages() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Fetch the News lifeline
      const { data: lifeline, error: lifelineError } = await supabase
        .from("lifelines")
        .select("id")
        .eq("slug", "news")
        .single();

      if (lifelineError) throw lifelineError;
      if (!lifeline) {
        toast.error("News lifeline not found");
        return;
      }

      // Fetch all News entries
      const { data: entries, error: entriesError } = await supabase
        .from("entries")
        .select("id, title")
        .eq("lifeline_id", lifeline.id)
        .order("occurred_on", { ascending: false });

      if (entriesError) throw entriesError;
      if (!entries || entries.length === 0) {
        toast.error("No entries found for News lifeline");
        return;
      }

      setProgress({ completed: 0, total: entries.length });

      // Import images for each entry
      const results = [];
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        try {
          const { data, error } = await supabase.functions.invoke('import-image-from-url', {
            body: {
              entryId: entry.id,
              imageUrl: `https://picsum.photos/800/600?random=${i + 1}`,
              altText: entry.title
            }
          });

          if (error) {
            console.error(`Failed to import image for ${entry.title}:`, error);
            results.push({ entry: entry.title, success: false, error: error.message });
          } else {
            results.push({ entry: entry.title, success: true });
          }
        } catch (err) {
          console.error(`Error importing image for ${entry.title}:`, err);
          results.push({ entry: entry.title, success: false, error: String(err) });
        }

        setProgress({ completed: i + 1, total: entries.length });
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed === 0) {
        toast.success(`Successfully imported ${successful} images!`);
      } else {
        toast.warning(`Imported ${successful} images, ${failed} failed`);
      }

      console.log('Import results:', results);
    } catch (error) {
      toast.error("Failed to import images");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">Import News Lifeline Images</h1>
      <p className="text-muted-foreground mb-6">
        This utility will import placeholder images from picsum.photos for all entries in the News lifeline.
        Each entry will get a unique random image.
      </p>

      <div className="bg-muted/50 p-6 rounded-lg space-y-4">
        <div className="space-y-2">
          <p className="font-medium">What this will do:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Fetch all entries from the News lifeline</li>
            <li>Import a 800x600 placeholder image for each entry</li>
            <li>Link images to entries via entry_media table</li>
          </ul>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Importing images: {progress.completed} / {progress.total}
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing... ({progress.completed}/{progress.total})
            </>
          ) : (
            "Import Images"
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Note: This is a one-time utility. After importing, you can navigate away from this page.
      </p>
    </div>
  );
}

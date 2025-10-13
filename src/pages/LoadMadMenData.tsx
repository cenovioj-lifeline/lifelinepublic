import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function LoadMadMenData() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    setProgress(10);

    try {
      // Call the edge function with parsed data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/load-mad-men-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            lifelines: [], // Paste lifelines data here
            entries: [], // Paste entries data here
          }),
        }
      );

      const result = await response.json();
      
      setProgress(100);
      
      toast({
        title: "Success",
        description: `Loaded ${result.lifelines_created} lifelines and ${result.entries_created} entries`,
      });
      
      if (result.errors && result.errors.length > 0) {
        console.error("Errors during load:", result.errors);
      }
    } catch (error: any) {
      console.error("Load error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Load Mad Men Data</CardTitle>
          <CardDescription>
            This tool loads the lifelines and entries from the Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Upload the Mad Men Excel file to extract and load all lifelines and entries.
            </AlertDescription>
          </Alert>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          )}

          <Button onClick={loadData} disabled={loading}>
            {loading ? "Loading..." : "Load Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

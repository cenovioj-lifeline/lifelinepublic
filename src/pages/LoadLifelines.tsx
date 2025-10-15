import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export default function LoadLifelines() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const { toast } = useToast();

  const { data: collections } = useQuery({
    queryKey: ["collections-for-load"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug")
        .order("title", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const loadData = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an Excel file first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCollectionId) {
      toast({
        title: "Error",
        description: "Please select a collection",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(5);
    setStatus("Reading Excel file...");

    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Parse lifelines sheet (first sheet)
      setStatus("Parsing lifelines...");
      setProgress(10);
      const lifelinesSheet = workbook.Sheets[workbook.SheetNames[0]];
      const lifelinesJson = XLSX.utils.sheet_to_json(lifelinesSheet);

      const lifelines = lifelinesJson.map((row: any) => ({
        title: row.Lifeline_name || row.lifeline_name,
        subject: row.subject_name,
        type: (row.lifeline_type || "person").toLowerCase(),
        intro: row.Introduction || row.introduction,
      }));

      // Parse entries sheet (second sheet)
      setStatus("Parsing entries...");
      setProgress(20);
      const entriesSheet = workbook.Sheets[workbook.SheetNames[1]];
      const entriesJson = XLSX.utils.sheet_to_json(entriesSheet);

      const entries = entriesJson.map((row: any, index: number) => ({
        lifeline_title: row.Lifeline_title || row.lifeline_title,
        date: row.date || "",
        title: row.entry_title,
        details: row.description,
        score: parseInt(row.rating) || 0,
        order_index: index,
      }));

      setStatus(`Sending ${lifelines.length} lifelines and ${entries.length} entries to server...`);
      setProgress(30);

      // Call the edge function
      const { data: result, error } = await supabase.functions.invoke('load-lifelines-data', {
        body: { 
          lifelines, 
          entries,
          collectionId: selectedCollectionId
        }
      });

      if (error) throw error;

      setProgress(100);
      setStatus("Complete!");

      toast({
        title: "Success",
        description: `Loaded ${result.lifelines_created} lifelines (${result.lifelines_skipped} skipped) and ${result.entries_created} entries`,
      });

      if (result.errors && result.errors.length > 0) {
        console.error("Errors during load:", result.errors);
        toast({
          title: "Some errors occurred",
          description: `${result.errors.length} errors. Check console for details.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Load error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setStatus("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Load Lifelines</CardTitle>
          <CardDescription>
            Upload an Excel file with lifelines and entries to bulk load data into a collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              The Excel file should have two sheets:
              <br />
              <strong>Sheet 1 (Lifelines):</strong> Lifeline_name, subject_name, lifeline_type, Introduction
              <br />
              <strong>Sheet 2 (Entries):</strong> Lifeline_title, date, entry_title, description, rating
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="collection">Select Collection</Label>
            <Select
              value={selectedCollectionId}
              onValueChange={setSelectedCollectionId}
              disabled={loading}
            >
              <SelectTrigger id="collection">
                <SelectValue placeholder="Choose a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections?.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excel-file">Excel File (.xlsx)</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          )}

          <Button onClick={loadData} disabled={loading || !file || !selectedCollectionId}>
            {loading ? "Loading..." : "Load Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
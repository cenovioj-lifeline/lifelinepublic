import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface ElectionResultsUploadProps {
  electionId: string;
  onUploadComplete: () => void;
}

export function ElectionResultsUpload({ electionId, onUploadComplete }: ElectionResultsUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Find header row (look for "Category" column)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        if (jsonData[i].some((cell: any) => 
          typeof cell === 'string' && cell.toLowerCase().includes('category')
        )) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = jsonData[headerRowIndex].map((h: any) => 
        typeof h === 'string' ? h.trim().toLowerCase() : ''
      );
      
      // Find column indices
      const categoryIdx = headers.findIndex((h: string) => 
        h === 'category' || h.includes('category') && !h.includes('superlative')
      );
      const superlativeIdx = headers.findIndex((h: string) => 
        h.includes('superlative')
      );
      const nameIdx = headers.findIndex((h: string) => 
        h.includes('name') || h.includes('custom')
      );
      const notesIdx = headers.findIndex((h: string) => 
        h.includes('notes')
      );

      if (categoryIdx === -1 || superlativeIdx === -1) {
        throw new Error("Could not find required columns (Category and Superlative Category)");
      }

      // Parse rows
      const results = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0 || !row[categoryIdx]) continue;

        const category = String(row[categoryIdx]).trim();
        const superlative_category = String(row[superlativeIdx] || '').trim();
        
        if (!category || !superlative_category) continue;

        results.push({
          election_id: electionId,
          category,
          superlative_category,
          winner_name: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : null,
          notes: notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : null,
        });
      }

      if (results.length === 0) {
        throw new Error("No valid results found in the file");
      }

      // Delete existing results for this election
      const { error: deleteError } = await supabase
        .from("election_results")
        .delete()
        .eq("election_id", electionId);

      if (deleteError) throw deleteError;

      // Insert new results
      const { error: insertError } = await supabase
        .from("election_results")
        .insert(results);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Uploaded ${results.length} results successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ["election-results", electionId] });
      onUploadComplete();

      // Reset the file input
      event.target.value = '';
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload results",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Results from Excel
        </CardTitle>
        <CardDescription>
          Upload an Excel file with columns: Category, Superlative Category, Custom Name, Notes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface CollectionQuotesUploadProps {
  collectionId: string;
}

export function CollectionQuotesUpload({ collectionId }: CollectionQuotesUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadedCount(null);

    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Read data without headers - first column is quote, second is author
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as Array<Array<any>>;

      // Validate and map data
      const quotes = jsonData
        .filter((row) => row[0] && String(row[0]).trim())
        .map((row) => ({
          collection_id: collectionId,
          quote: String(row[0]).trim(),
          author: row[1] ? String(row[1]).trim() : null,
          context: null,
        }));

      if (quotes.length === 0) {
        throw new Error("No valid quotes found in the file. Make sure the first column contains quote text.");
      }

      // Delete old quotes for this collection
      const { error: deleteError } = await supabase
        .from("collection_quotes")
        .delete()
        .eq("collection_id", collectionId);

      if (deleteError) throw deleteError;

      // Insert new quotes
      const { error: insertError } = await supabase
        .from("collection_quotes")
        .insert(quotes);

      if (insertError) throw insertError;

      setUploadedCount(quotes.length);
      toast({
        title: "Success",
        description: `${quotes.length} quotes uploaded successfully`,
      });

      // Reset the input
      event.target.value = "";
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
      <div>
        <h3 className="text-lg font-semibold mb-2">Collection Quotes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload an Excel or CSV file with quotes. First column should contain the quote text, second column (optional) should contain the author name.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quotes-file">Upload Spreadsheet</Label>
        <div className="flex items-center gap-4">
          <Input
            id="quotes-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="flex-1"
          />
          {uploading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          {uploadedCount !== null && !uploading && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{uploadedCount} quotes</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Uploading a new file will completely replace existing quotes for this collection.
        </p>
      </div>
    </div>
  );
}
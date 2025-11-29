import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DuplicateGroup {
  title: string;
  lifelines: Array<{
    id: string;
    entry_count: number;
    has_subject_link: boolean;
    cover_image_url: string | null;
  }>;
  safe_to_delete: boolean;
  warning_reason?: string;
  keep_lifeline_id: string;
  delete_lifeline_ids: string[];
  entries_to_save: number;
}

interface AnalysisResult {
  success: boolean;
  duplicate_groups: DuplicateGroup[];
  total_duplicates: number;
  safe_to_delete: number;
  requires_review: number;
}

interface CollectionDuplicateCleanupProps {
  collectionId: string;
}

export function CollectionDuplicateCleanup({ collectionId }: CollectionDuplicateCleanupProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    setIsScanning(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-duplicate-lifelines', {
        body: {
          collection_id: collectionId,
          mode: 'analyze',
        },
      });

      if (error) throw error;

      setAnalysis(data as AnalysisResult);

      if (data.total_duplicates === 0) {
        toast({
          title: "No duplicates found",
          description: "This collection has no duplicate lifelines.",
        });
      } else {
        toast({
          title: "Scan complete",
          description: `Found ${data.total_duplicates} duplicate groups. ${data.safe_to_delete} safe to delete, ${data.requires_review} require review.`,
        });
      }
    } catch (error: any) {
      console.error('Error scanning for duplicates:', error);
      toast({
        title: "Error scanning",
        description: error.message || "Failed to scan for duplicate lifelines",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = async () => {
    if (!analysis) return;

    const safeCount = analysis.safe_to_delete;
    if (safeCount === 0) {
      toast({
        title: "Nothing to delete",
        description: "No safe duplicates found to delete automatically.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-duplicate-lifelines', {
        body: {
          collection_id: collectionId,
          mode: 'execute',
        },
      });

      if (error) throw error;

      toast({
        title: "Cleanup complete",
        description: `Successfully deleted ${data.deleted_count} duplicate lifelines.`,
      });

      // Refresh the analysis
      handleScan();
    } catch (error: any) {
      console.error('Error deleting duplicates:', error);
      toast({
        title: "Error deleting",
        description: error.message || "Failed to delete duplicate lifelines",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleScan}
          disabled={isScanning || isDeleting}
          variant="outline"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            "Scan for Duplicates"
          )}
        </Button>

        {analysis && analysis.safe_to_delete > 0 && (
          <Button
            onClick={handleDelete}
            disabled={isDeleting || isScanning}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {analysis.safe_to_delete} Safe Duplicate{analysis.safe_to_delete !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </div>

      {analysis && analysis.duplicate_groups.length > 0 && (
        <div className="space-y-3 mt-6">
          <h4 className="font-medium text-sm">Results:</h4>
          {analysis.duplicate_groups.map((group, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                group.safe_to_delete
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {group.safe_to_delete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="font-medium text-sm">"{group.title}"</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <strong>KEEP:</strong> {group.lifelines[0].entry_count} entries
                      {group.lifelines[0].has_subject_link && ", has profile link"}
                      {group.lifelines[0].cover_image_url && ", has image"}
                    </div>
                    {group.lifelines.slice(1).map((lifeline, idx) => (
                      <div key={idx}>
                        <strong>DELETE:</strong> {lifeline.entry_count} entries
                        {lifeline.has_subject_link && ", has profile link"}
                        {lifeline.cover_image_url && ", has image"}
                      </div>
                    ))}
                  </div>
                  {!group.safe_to_delete && group.warning_reason && (
                    <Alert className="mt-2">
                      <AlertDescription className="text-xs">
                        <strong>⚠️ Manual review required:</strong> {group.warning_reason}
                        <br />
                        → Contact Lovable to resolve this case.
                      </AlertDescription>
                    </Alert>
                  )}
                  {group.safe_to_delete && group.entries_to_save > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Will remove {group.entries_to_save} orphan entry/entries
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

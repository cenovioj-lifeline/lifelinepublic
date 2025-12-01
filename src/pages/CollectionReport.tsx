import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCollectionReport } from "@/hooks/useCollectionReport";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CollectionReport() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const { data: collections } = useQuery({
    queryKey: ['collections-for-report'],
    queryFn: async () => {
      const { data } = await supabase
        .from('collections')
        .select('id, title, slug')
        .order('title');
      return data || [];
    },
  });

  const { data: report, isLoading } = useCollectionReport(selectedCollectionId);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const formatPercentage = (value: number) => `${value.toFixed(0)}%`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collection Report</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive data quality metrics for collections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Collection</CardTitle>
          <CardDescription>Choose a collection to view its data quality report</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCollectionId || ""} onValueChange={setSelectedCollectionId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a collection..." />
            </SelectTrigger>
            <SelectContent>
              {collections?.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.title}
                </SelectItem>
              ))
            }</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-4">
          {/* Lifelines & Entries Section */}
          <Card>
            <CardHeader>
              <CardTitle>Lifelines & Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Person Lifelines</span>
                  <span className="text-lg font-semibold">{report.lifelines.personCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">List Lifelines</span>
                  <span className="text-lg font-semibold">{report.lifelines.listCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">% Lifelines with Cover Image</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.lifelines.coverImagePercentage))}>
                    {formatPercentage(report.lifelines.coverImagePercentage)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">% Entries with Dates</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.entries.datePercentage))}>
                    {formatPercentage(report.entries.datePercentage)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">% Entries with Scores</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.entries.scorePercentage))}>
                    {formatPercentage(report.entries.scorePercentage)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Entries with SerpAPI Queries</span>
                  <span className="text-lg font-semibold">
                    {report.entries.serpApiCount} of {report.entries.serpApiTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">% Entries with Images</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.entries.imagePercentage))}>
                    {formatPercentage(report.entries.imagePercentage)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profiles Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Total Profiles</span>
                  <span className="text-lg font-semibold">{report.profiles.total}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Have Full Data</span>
                  <span className="flex items-center gap-2">
                    {report.profiles.hasFullData ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Have Images</span>
                  <span className="flex items-center gap-2">
                    {report.profiles.hasImages ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Linked to Lifelines</span>
                  <span className="flex items-center gap-2">
                    {report.profiles.linkedToLifelines ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Linked to MER</span>
                  <span className="flex items-center gap-2">
                    {report.profiles.linkedToMER ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Linked to Quotes</span>
                  <span className="flex items-center gap-2">
                    {report.profiles.linkedToQuotes ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">% with Images</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.profiles.imagePercentage))}>
                    {formatPercentage(report.profiles.imagePercentage)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Quotes Exist</span>
                  <span className="flex items-center gap-2">
                    {report.quotes.exists ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes ({report.quotes.count})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Linked to Profiles</span>
                  <span className="flex items-center gap-2">
                    {report.quotes.linkedToProfiles ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">% Showing Profile Images</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.quotes.profileImagePercentage))}>
                    {formatPercentage(report.quotes.profileImagePercentage)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mock Election Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Mock Election Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">MER Exists</span>
                  <span className="flex items-center gap-2">
                    {report.mer.exists ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes ({report.mer.count} results)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Linked to Profiles</span>
                  <span className="flex items-center gap-2">
                    {report.mer.linkedToProfiles ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">% Showing Profile Images</span>
                  <span className={cn("text-lg font-semibold", getPercentageColor(report.mer.profileImagePercentage))}>
                    {formatPercentage(report.mer.profileImagePercentage)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Section */}
          <Card>
            <CardHeader>
              <CardTitle>Other</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Has Custom Color Scheme</span>
                  <span className="flex items-center gap-2">
                    {report.other.hasCustomColorScheme ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">
                          Yes {report.other.colorSchemeName && `(${report.other.colorSchemeName})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">No</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

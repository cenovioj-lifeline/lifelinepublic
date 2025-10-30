import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { Loader2, Search, FileText, Filter } from "lucide-react";

interface LifelineWithStats {
  id: string;
  title: string;
  slug: string;
  lifeline_type: string;
  collection_id: string | null;
  collections: { title: string } | null;
  total_events: number;
  events_with_pics: number;
  events_with_locked: number;
}

export default function LifelineImageManager() {
  const queryClient = useQueryClient();
  const [selectedLifelineId, setSelectedLifelineId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch collections for filter
  const { data: collections } = useQuery({
    queryKey: ["collections-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch lifelines with stats
  const { data: lifelines, isLoading: lifelinesLoading } = useQuery({
    queryKey: ["lifelines-with-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          id,
          title,
          slug,
          lifeline_type,
          collection_id,
          collections (title)
        `)
        .order("title");
      
      if (error) throw error;

      // Fetch stats for each lifeline
      const lifelinesWithStats = await Promise.all(
        data.map(async (lifeline) => {
          const { count: totalEvents } = await supabase
            .from("entries")
            .select("*", { count: "exact", head: true })
            .eq("lifeline_id", lifeline.id);

          const { data: entriesWithMedia } = await supabase
            .from("entries")
            .select("id, entry_media(id, locked)")
            .eq("lifeline_id", lifeline.id);

          const eventsWithPics = entriesWithMedia?.filter(
            (e: any) => e.entry_media && e.entry_media.length > 0
          ).length || 0;

          const eventsWithLocked = entriesWithMedia?.filter(
            (e: any) => e.entry_media && e.entry_media.some((m: any) => m.locked)
          ).length || 0;

          return {
            ...lifeline,
            total_events: totalEvents || 0,
            events_with_pics: eventsWithPics,
            events_with_locked: eventsWithLocked,
          };
        })
      );

      return lifelinesWithStats as LifelineWithStats[];
    },
  });

  const handleLoadImages = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    if (isSearching) {
      toast.error("Image loading is already in progress. Please wait for it to complete.");
      return;
    }

    setIsSearching(true);
    toast.info("Finding and importing images... This may take several minutes as it processes in batches.");

    try {
      const { data, error } = await supabase.functions.invoke('find-and-import-lifeline-images', {
        body: { lifelineId: selectedLifelineId, dryRun: false, startIndex: 0 }
      });

      if (error) {
        console.error('Error finding images:', error);
        toast.error(error.message || "Failed to find images");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['lifelines-with-stats'] });

      const { imported, failed, skipped, isComplete, batchInfo } = data;
      
      if (isComplete) {
        toast.success(`Import complete: ${imported} images imported, ${failed} failed, ${skipped} already had images`);
      } else {
        toast.success(`Batch ${batchInfo?.batchEnd}/${batchInfo?.totalToProcess} complete. Processing continues in background...`);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['lifelines-with-stats'] });
        }, 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReturnQuery = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    setIsGeneratingQueries(true);
    toast.info("Generating query preview...");

    try {
      const { data, error } = await supabase.functions.invoke('find-and-import-lifeline-images', {
        body: { lifelineId: selectedLifelineId, dryRun: true }
      });

      if (error) {
        console.error('Error generating queries:', error);
        toast.error(error.message || "Failed to generate queries");
        return;
      }

      // Create MD file content
      let mdContent = `# SerpAPI Query Preview\n\n`;
      mdContent += `## Lifeline Metadata\n\n`;
      mdContent += `- **Character:** ${data.lifeline?.characterName || 'N/A'}\n`;
      mdContent += `- **Collection:** ${data.lifeline?.collectionTitle || 'N/A'}\n`;
      if (data.lifeline?.actorName) {
        mdContent += `- **Actor:** ${data.lifeline.actorName}\n`;
      }
      mdContent += `- **Type:** ${data.lifeline?.type || 'N/A'}\n\n`;
      
      mdContent += `## Generated Queries\n\n`;
      data.queryPreview?.forEach((item: any, index: number) => {
        mdContent += `### ${index + 1}. ${item.entryTitle}\n\n`;
        item.queries.forEach((query: string, qIndex: number) => {
          const variantLabel = qIndex === 0 ? "Broad" : qIndex === 1 ? "Context-focused" : "Domain-biased";
          mdContent += `**Variant ${qIndex + 1} (${variantLabel}):**\n\`\`\`\n${query}\n\`\`\`\n\n`;
        });
      });

      // Download the file
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-preview-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Query preview downloaded");
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  const handleExportLifeline = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    setIsExporting(true);
    toast.info("Exporting lifeline data...");

    try {
      // Fetch lifeline with collection
      const { data: lifeline, error: lifelineError } = await supabase
        .from("lifelines")
        .select(`
          *,
          collections (
            id,
            title,
            description,
            category
          )
        `)
        .eq("id", selectedLifelineId)
        .single();

      if (lifelineError) throw lifelineError;

      // Fetch entries
      const { data: entries, error: entriesError } = await supabase
        .from("entries")
        .select("*")
        .eq("lifeline_id", selectedLifelineId)
        .order("occurred_on");

      if (entriesError) throw entriesError;

      // Build MD content
      let mdContent = ``;
      
      // Add collection info if exists
      if (lifeline.collections) {
        const collection = lifeline.collections as any;
        mdContent += `# Collection: ${collection.title}\n\n`;
        if (collection.description) {
          mdContent += `${collection.description}\n\n`;
        }
        if (collection.category) {
          mdContent += `**Category:** ${collection.category}\n\n`;
        }
        mdContent += `---\n\n`;
      }

      // Add lifeline info
      mdContent += `# Lifeline: ${lifeline.title}\n\n`;
      if (lifeline.subtitle) {
        mdContent += `**${lifeline.subtitle}**\n\n`;
      }
      if (lifeline.intro) {
        mdContent += `## Introduction\n\n${lifeline.intro}\n\n`;
      }

      // Add entries
      if (entries && entries.length > 0) {
        mdContent += `## Timeline Events\n\n`;
        entries.forEach((entry: any, index: number) => {
          mdContent += `### ${index + 1}. ${entry.title}\n\n`;
          if (entry.occurred_on) {
            mdContent += `**Date:** ${new Date(entry.occurred_on).toLocaleDateString()}\n\n`;
          }
          if (entry.summary) {
            mdContent += `${entry.summary}\n\n`;
          }
          if (entry.details) {
            mdContent += `**Details:**\n\n${entry.details}\n\n`;
          }
          mdContent += `---\n\n`;
        });
      }

      if (lifeline.conclusion) {
        mdContent += `## Conclusion\n\n${lifeline.conclusion}\n\n`;
      }

      // Download the file
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lifeline.slug}-lifeline-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Lifeline data exported");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to export lifeline");
    } finally {
      setIsExporting(false);
    }
  };

  // Filter lifelines
  const filteredLifelines = lifelines?.filter((lifeline) => {
    const matchesSearch = lifeline.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = collectionFilter === "all" || lifeline.collection_id === collectionFilter;
    const matchesType = typeFilter === "all" || lifeline.lifeline_type === typeFilter;
    return matchesSearch && matchesCollection && matchesType;
  });

  const selectedLifeline = lifelines?.find((l) => l.id === selectedLifelineId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lifeline Image Manager</h1>
          <p className="text-muted-foreground mt-2">
            Select a lifeline to load images, generate queries, or export data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Lifelines</CardTitle>
            <CardDescription>Filter and select a lifeline to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lifelines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="topic">Topic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {lifelinesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={15} minSize={10}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky top-0 bg-background">Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => (
                            <TableRow
                              key={lifeline.id}
                              className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedLifelineId(lifeline.id)}
                            >
                              <TableCell className="capitalize">{lifeline.lifeline_type}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={35} minSize={20}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky top-0 bg-background">Lifeline Name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => (
                            <TableRow
                              key={lifeline.id}
                              className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedLifelineId(lifeline.id)}
                            >
                              <TableCell className="font-medium">{lifeline.title}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={20} minSize={15}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky top-0 bg-background">Collection</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => (
                            <TableRow
                              key={lifeline.id}
                              className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedLifelineId(lifeline.id)}
                            >
                              <TableCell>{lifeline.collections?.title || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={12} minSize={10}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right sticky top-0 bg-background"># Events / # Pics</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => (
                            <TableRow
                              key={lifeline.id}
                              className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedLifelineId(lifeline.id)}
                            >
                              <TableCell className="text-right">
                                {lifeline.total_events} / {lifeline.events_with_pics}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={10} minSize={8}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right sticky top-0 bg-background">% with Pics</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => {
                            const percentage = lifeline.total_events > 0 
                              ? Math.round((lifeline.events_with_pics / lifeline.total_events) * 100)
                              : 0;
                            return (
                              <TableRow
                                key={lifeline.id}
                                className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                                onClick={() => setSelectedLifelineId(lifeline.id)}
                              >
                                <TableCell className="text-right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={12} minSize={10}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right sticky top-0 bg-background"># Events / # Locked</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => (
                            <TableRow
                              key={lifeline.id}
                              className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedLifelineId(lifeline.id)}
                            >
                              <TableCell className="text-right">
                                {lifeline.total_events} / {lifeline.events_with_locked}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={10} minSize={8}>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right sticky top-0 bg-background">% Locked</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLifelines?.map((lifeline) => {
                            const percentage = lifeline.total_events > 0 
                              ? Math.round((lifeline.events_with_locked / lifeline.total_events) * 100)
                              : 0;
                            return (
                              <TableRow
                                key={lifeline.id}
                                className={`cursor-pointer ${selectedLifelineId === lifeline.id ? 'bg-muted' : ''}`}
                                onClick={() => setSelectedLifelineId(lifeline.id)}
                              >
                                <TableCell className="text-right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedLifelineId && selectedLifeline && (
          <Card>
            <CardHeader>
              <CardTitle>Actions for {selectedLifeline.title}</CardTitle>
              <CardDescription>Load images, generate query preview, or export as markdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  onClick={handleLoadImages}
                  disabled={isSearching}
                  className="flex-1"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Load Images
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleReturnQuery}
                  disabled={isGeneratingQueries}
                  variant="outline"
                  className="flex-1"
                >
                  {isGeneratingQueries ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Return Query
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleExportLifeline}
                  disabled={isExporting}
                  variant="outline"
                  className="flex-1"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Export Lifeline as MD
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </AdminLayout>
  );
}

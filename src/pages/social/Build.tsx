import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2, Check, Save, ChevronDown, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LifelineFormState {
  title: string;
  lifeline_type: string;
  purpose: string;
}

interface EntryFormState {
  title: string;
  description: string;
  score: number;
  year: string;
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

interface SavedEntry {
  id?: string;
  title: string;
  description: string;
  score: number;
  year: string;
}

type ContentType = "lifelines" | "quotes" | "awards" | "media" | "books";
type Mode = "ai" | "direct";
type MobilePanel = "chat" | "form";

const contentTypeConfig: Record<ContentType, { label: string; icon: string }> = {
  lifelines: { label: "Lifelines", icon: "📈" },
  quotes: { label: "Quotes", icon: "💬" },
  awards: { label: "Awards", icon: "🏆" },
  media: { label: "Media", icon: "🖼️" },
  books: { label: "Books", icon: "📚" },
};

// Parse various date input formats into YYYY-MM-DD for database
const parseDateInput = (input: string): string | null => {
  if (!input || !input.trim()) return null;
  
  const trimmed = input.trim();
  
  // Year only: "2020" or "2024"
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`;
  }
  
  // MM/DD/YYYY format: "12/15/2024"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // YYYY-MM-DD format: already valid
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try parsing with JavaScript Date as fallback
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If nothing works, return null (will be stored as null in DB)
  return null;
};

export default function Build() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  
  // UI State
  const [mode, setMode] = useState<Mode>("ai");
  const [contentType, setContentType] = useState<ContentType>("lifelines");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");
  
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! Let's build your collection. I'll help you create lifelines - visual timelines of meaningful moments.\n\nWant to start with your personal lifeline? Just tell me what kind of journey you'd like to document - your career, relationships, hobbies, or anything else that matters to you." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [lifelineForm, setLifelineForm] = useState<LifelineFormState>({
    title: "",
    lifeline_type: "",
    purpose: ""
  });
  
  const [entryForm, setEntryForm] = useState<EntryFormState>({
    title: "",
    description: "",
    score: 0,
    year: ""
  });
  
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [lifelineId, setLifelineId] = useState<string | null>(null);
  const [lifelineSaved, setLifelineSaved] = useState(false);
  const [savingLifeline, setSavingLifeline] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch collection info
  const { data: collection } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!collectionId
  });

  // Fetch lifeline count for this collection
  const { data: lifelineCount } = useQuery({
    queryKey: ["lifelineCount", collectionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lifelines")
        .select("*", { count: "exact", head: true })
        .eq("collection_id", collectionId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!collectionId
  });

  // Check for existing lifeline in this collection
  useEffect(() => {
    const checkExistingLifeline = async () => {
      if (!collectionId) return;
      
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, lifeline_type, intro")
        .eq("collection_id", collectionId)
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        setLifelineId(data.id);
        setLifelineSaved(true);
        setLifelineForm({
          title: data.title || "",
          lifeline_type: data.lifeline_type || "",
          purpose: data.intro || ""
        });
        
        // Also load existing entries
        const { data: entries } = await supabase
          .from("entries")
          .select("id, title, summary, score, occurred_on")
          .eq("lifeline_id", data.id)
          .order("occurred_on", { ascending: true });
        
        if (entries) {
          setSavedEntries(entries.map(e => ({
            id: e.id,
            title: e.title || "",
            description: e.summary || "",
            score: e.score || 0,
            year: e.occurred_on ? e.occurred_on.substring(0, 4) : ""
          })));
        }
      }
    };
    
    checkExistingLifeline();
  }, [collectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate a slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50) + '-' + Date.now().toString(36);
  };

  // Save lifeline to database
  const saveLifelineToDb = async (): Promise<string | null> => {
    if (!collectionId || !lifelineForm.title) {
      toast.error("Please provide a lifeline title");
      return null;
    }
    
    setSavingLifeline(true);
    try {
      const slug = generateSlug(lifelineForm.title);
      
      const { data, error } = await supabase
        .from("lifelines")
        .insert({
          collection_id: collectionId,
          title: lifelineForm.title,
          slug: slug,
          lifeline_type: (lifelineForm.lifeline_type || "person") as "person" | "list",
          intro: lifelineForm.purpose,
          status: "draft"
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setLifelineId(data.id);
      setLifelineSaved(true);
      toast.success("Lifeline created!");
      return data.id;
    } catch (err) {
      console.error("Failed to save lifeline:", err);
      toast.error("Failed to save lifeline");
      return null;
    } finally {
      setSavingLifeline(false);
    }
  };

  // Save entry to database
  const saveEntryToDb = async (): Promise<boolean> => {
    if (!lifelineId) {
      toast.error("Please create the lifeline first");
      return false;
    }
    
    if (!entryForm.title) {
      toast.error("Please provide an entry title");
      return false;
    }
    
    setSavingEntry(true);
    try {
      const slug = generateSlug(entryForm.title);
      const orderIndex = savedEntries.length;
      
      // Parse the date input into proper YYYY-MM-DD format
      const occurredOn = parseDateInput(entryForm.year);
      
      const { data, error } = await supabase
        .from("entries")
        .insert({
          lifeline_id: lifelineId,
          title: entryForm.title,
          slug: slug,
          summary: entryForm.description,
          score: entryForm.score,
          occurred_on: occurredOn,
          order_index: orderIndex
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add to saved entries list
      setSavedEntries(prev => [...prev, {
        id: data.id,
        title: entryForm.title,
        description: entryForm.description,
        score: entryForm.score,
        year: entryForm.year
      }]);
      
      // Clear entry form
      setEntryForm({ title: "", description: "", score: 0, year: "" });
      
      toast.success("Entry saved!");
      return true;
    } catch (err) {
      console.error("Failed to save entry:", err);
      toast.error("Failed to save entry");
      return false;
    } finally {
      setSavingEntry(false);
    }
  };

  const processToolCalls = async (toolCalls: ToolCall[]) => {
    for (const call of toolCalls) {
      if (call.name === "update_form_field") {
        const { field, value } = call.input as { field: string; value: string };
        
        // Lifeline fields
        if (["title", "lifeline_type", "purpose"].includes(field)) {
          setLifelineForm(prev => ({ ...prev, [field]: value }));
        }
        // Entry fields
        else if (field === "entry_title") {
          setEntryForm(prev => ({ ...prev, title: value }));
        } else if (field === "entry_description") {
          setEntryForm(prev => ({ ...prev, description: value }));
        } else if (field === "entry_score") {
          setEntryForm(prev => ({ ...prev, score: parseInt(value) || 0 }));
        } else if (field === "entry_year") {
          setEntryForm(prev => ({ ...prev, year: value }));
        }
      } else if (call.name === "save_lifeline" && (call.input as { confirm: boolean }).confirm) {
        // Save lifeline to database
        if (!lifelineSaved) {
          await saveLifelineToDb();
        }
      } else if (call.name === "save_entry" && (call.input as { confirm: boolean }).confirm) {
        // Save entry to database
        await saveEntryToDb();
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-wizard", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          formState: {
            lifeline: lifelineForm,
            lifelineSaved: lifelineSaved,
            lifelineId: lifelineId,
            entry: entryForm,
            savedEntriesCount: savedEntries.length
          }
        }
      });

      if (error) throw error;

      // Process tool calls first (this may save to DB)
      if (data.toolCalls && data.toolCalls.length > 0) {
        await processToolCalls(data.toolCalls);
      }

      // Add assistant message
      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      }

    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Sorry, I encountered an error. Please try again.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Manual save handlers
  const handleManualSaveLifeline = async () => {
    if (!lifelineSaved) {
      await saveLifelineToDb();
    }
  };

  const handleManualSaveEntry = async () => {
    await saveEntryToDb();
  };

  // Content counts (placeholder for now - only lifelines is real)
  const contentCounts: Record<ContentType, number> = {
    lifelines: lifelineCount || 0,
    quotes: 0,
    awards: 0,
    media: 0,
    books: 0,
  };

  // Render the form content (shared between AI and Direct modes)
  const renderFormContent = () => {
    if (contentType !== "lifelines") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-4">{contentTypeConfig[contentType].icon}</span>
          <h3 className="font-semibold text-lg mb-2">{contentTypeConfig[contentType].label}</h3>
          <p className="text-muted-foreground text-sm">
            This content type is coming soon. For now, you can create lifelines.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setContentType("lifelines")}
          >
            Switch to Lifelines
          </Button>
        </div>
      );
    }

    return (
      <>
        {/* Lifeline fields */}
        <div>
          <Label>Title</Label>
          <Input 
            value={lifelineForm.title} 
            onChange={(e) => setLifelineForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., My Career Journey"
            disabled={lifelineSaved}
          />
        </div>
        
        <div>
          <Label>Type</Label>
          <Select 
            value={lifelineForm.lifeline_type} 
            onValueChange={(v) => setLifelineForm(prev => ({ ...prev, lifeline_type: v }))}
            disabled={lifelineSaved}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="person">Person (about me)</SelectItem>
              <SelectItem value="list">List (collection of things)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Purpose</Label>
          <Textarea 
            value={lifelineForm.purpose}
            onChange={(e) => setLifelineForm(prev => ({ ...prev, purpose: e.target.value }))}
            placeholder="What is this lifeline about?"
            rows={2}
            disabled={lifelineSaved}
          />
        </div>

        {/* Save Lifeline Button */}
        {!lifelineSaved && (
          <Button 
            onClick={handleManualSaveLifeline}
            disabled={savingLifeline || !lifelineForm.title}
            className="w-full"
          >
            {savingLifeline ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Lifeline</>
            )}
          </Button>
        )}

        {/* Divider */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-3">Add an Entry</h3>
          {!lifelineSaved && (
            <p className="text-sm text-muted-foreground mb-3">
              Save the lifeline first before adding entries.
            </p>
          )}
        </div>
        
        <div>
          <Label>What happened?</Label>
          <Input 
            value={entryForm.title}
            onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Entry title"
            disabled={!lifelineSaved}
          />
        </div>
        
        <div>
          <Label>Tell the story</Label>
          <Textarea 
            value={entryForm.description}
            onChange={(e) => setEntryForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What made this moment meaningful?"
            rows={3}
            disabled={!lifelineSaved}
          />
        </div>
        
        {/* Two-column row for score and year (matches mockup) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>How did it feel? ({entryForm.score})</Label>
            <Slider
              value={[entryForm.score]}
              onValueChange={([v]) => setEntryForm(prev => ({ ...prev, score: v }))}
              min={-10}
              max={10}
              step={1}
              className="mt-2"
              disabled={!lifelineSaved}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>-10</span>
              <span>0</span>
              <span>+10</span>
            </div>
          </div>
          
          <div>
            <Label>When?</Label>
            <Input 
              value={entryForm.year}
              onChange={(e) => setEntryForm(prev => ({ ...prev, year: e.target.value }))}
              placeholder="e.g., 2020 or 12/15/2024"
              disabled={!lifelineSaved}
            />
          </div>
        </div>

        {/* Save Entry Button */}
        {lifelineSaved && (
          <Button 
            onClick={handleManualSaveEntry}
            disabled={savingEntry || !entryForm.title}
            className="w-full"
            variant="secondary"
          >
            {savingEntry ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Add Entry</>
            )}
          </Button>
        )}

        {/* Saved entries preview */}
        {savedEntries.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Saved Entries ({savedEntries.length})</h3>
            <div className="space-y-2">
              {savedEntries.map((entry, i) => (
                <div key={entry.id || i} className="bg-green-50 border border-green-100 p-2 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <strong className="truncate">{entry.title}</strong>
                    {entry.year && <span className="text-muted-foreground text-xs">({entry.year})</span>}
                    <span className="ml-auto text-xs whitespace-nowrap">Score: {entry.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // Render chat panel
  const renderChatPanel = () => (
    <Card className="h-[calc(100vh-200px)] lg:h-[calc(100vh-140px)] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Chat with AI</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === "user" 
                  ? "bg-blue-50 border border-blue-100 ml-8" 
                  : "bg-white border mr-8"
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {msg.role === "user" ? "You" : "AI Assistant"}
              </p>
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="bg-white border mr-8 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 hidden lg:block">
          Tip: You can also edit the form directly and use the Save buttons.
        </p>
      </CardContent>
    </Card>
  );

  // Render form panel
  const renderFormPanel = () => (
    <Card className="h-[calc(100vh-200px)] lg:h-[calc(100vh-140px)] overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {contentType === "lifelines" ? "Lifeline Details" : `${contentTypeConfig[contentType].label} (Coming Soon)`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderFormContent()}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto">
          {/* Desktop: Single row | Mobile: Stacked rows */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Top row (mobile) / Left side (desktop) */}
            <div className="flex items-center gap-3">
              {/* Back button */}
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                <ArrowLeft className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Back to Profile</span>
              </Button>
              
              {/* Title - shown in top row on mobile */}
              <div className="lg:hidden flex-1">
                <h1 className="font-semibold text-sm truncate">{collection?.title || "Building Your Collection"}</h1>
                <p className="text-xs text-muted-foreground">Building your story</p>
              </div>
            </div>
            
            {/* Controls row (mobile) / continues inline (desktop) */}
            <div className="flex items-center gap-2 lg:gap-3">
              <Separator orientation="vertical" className="h-6 hidden lg:block" />
              
              {/* Content type dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 lg:flex-none lg:min-w-[160px] justify-between">
                    <span className="flex items-center gap-2">
                      <span>{contentTypeConfig[contentType].icon}</span>
                      <span>{contentTypeConfig[contentType].label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {contentCounts[contentType]}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  {(Object.keys(contentTypeConfig) as ContentType[]).map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => setContentType(type)}
                      className="flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span>{contentTypeConfig[type].icon}</span>
                        <span>{contentTypeConfig[type].label}</span>
                      </span>
                      <span className={`text-xs ${contentCounts[type] > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                        {contentCounts[type]}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mode toggle - short labels on mobile, full on desktop */}
              <div className="flex bg-muted rounded-md p-0.5">
                <Button
                  variant={mode === "ai" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs px-2 lg:px-3"
                  onClick={() => setMode("ai")}
                >
                  <span className="lg:hidden">AI</span>
                  <span className="hidden lg:inline">AI Assist</span>
                </Button>
                <Button
                  variant={mode === "direct" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs px-2 lg:px-3"
                  onClick={() => setMode("direct")}
                >
                  <span className="lg:hidden">Edit</span>
                  <span className="hidden lg:inline">Direct Edit</span>
                </Button>
              </div>
            </div>
            
            {/* Title - pushed right (desktop only) */}
            <div className="hidden lg:block ml-auto text-right">
              <h1 className="font-semibold">{collection?.title || "Building Your Collection"}</h1>
              <p className="text-sm text-muted-foreground">Building your story</p>
            </div>
            
            {/* Status */}
            {lifelineSaved && (
              <div className="hidden lg:flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Lifeline saved
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Tabs - Mobile only, AI mode only */}
      {mode === "ai" && (
        <div className="lg:hidden bg-white border-b flex">
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              mobilePanel === "chat" 
                ? "text-foreground border-foreground" 
                : "text-muted-foreground border-transparent"
            }`}
            onClick={() => setMobilePanel("chat")}
          >
            Chat
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              mobilePanel === "form" 
                ? "text-foreground border-foreground" 
                : "text-muted-foreground border-transparent"
            }`}
            onClick={() => setMobilePanel("form")}
          >
            Form
          </button>
        </div>
      )}

      {/* Main Content */}
      {mode === "ai" ? (
        // AI Assist Mode: Two-panel on desktop, tabs on mobile
        <div className="max-w-6xl mx-auto p-4">
          {/* Desktop: Side by side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4">
            {renderChatPanel()}
            {renderFormPanel()}
          </div>
          
          {/* Mobile: One panel at a time based on tab */}
          <div className="lg:hidden">
            {mobilePanel === "chat" ? renderChatPanel() : renderFormPanel()}
          </div>
        </div>
      ) : (
        // Direct Edit Mode: Single-column layout (720px max-width matching mockup)
        <div className="mx-auto p-4" style={{ maxWidth: '720px' }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {contentType === "lifelines" ? "New Lifeline" : `${contentTypeConfig[contentType].label} (Coming Soon)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Hint Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 lg:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800 flex-1">
                  Want help filling this out? AI can guide you through the process.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-100 w-full sm:w-auto"
                  onClick={() => setMode("ai")}
                >
                  Switch to AI Assist
                </Button>
              </div>

              {renderFormContent()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

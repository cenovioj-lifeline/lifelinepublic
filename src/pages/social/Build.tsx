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
import { ArrowLeft, Send, Loader2, Check, Save, ChevronDown, Lightbulb, Pencil, Trash2, ChevronUp } from "lucide-react";
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
type AiContext = "New Entry" | "New Lifeline" | "Edit Entry" | "Lifeline Details";

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

// Format date for display
const formatDateForDisplay = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default function Build() {
  const { collectionId } = useParams();
  const navigate = useNavigate();

  // UI State
  const [mode, setMode] = useState<Mode>("ai");
  const [contentType, setContentType] = useState<ContentType>("lifelines");

  // NEW: AI Form UI State
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [aiContext, setAiContext] = useState<AiContext>("New Entry");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

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
        // Update AI context since lifeline exists
        setAiContext("New Entry");

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
      } else {
        // No lifeline yet, context is New Lifeline
        setAiContext("New Lifeline");
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
      setAiContext("New Entry"); // After saving lifeline, context becomes entry
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

  // Save entry to database (handles both create and edit)
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
      const occurredOn = parseDateInput(entryForm.year);

      if (editingEntryId) {
        // UPDATE existing entry
        const { error } = await supabase
          .from("entries")
          .update({
            title: entryForm.title,
            summary: entryForm.description,
            score: entryForm.score,
            occurred_on: occurredOn
          })
          .eq("id", editingEntryId);

        if (error) throw error;

        // Update in local state
        setSavedEntries(prev => prev.map(e =>
          e.id === editingEntryId
            ? { ...e, title: entryForm.title, description: entryForm.description, score: entryForm.score, year: entryForm.year }
            : e
        ));

        setEditingEntryId(null);
        setAiContext("New Entry");
        toast.success("Entry updated!");
      } else {
        // CREATE new entry
        const orderIndex = savedEntries.length;

        const { data, error } = await supabase
          .from("entries")
          .insert({
            lifeline_id: lifelineId,
            title: entryForm.title,
            summary: entryForm.description,
            score: entryForm.score,
            occurred_on: occurredOn,
            order_index: orderIndex
          })
          .select()
          .single();

        if (error) throw error;

        setSavedEntries(prev => [...prev, {
          id: data.id,
          title: entryForm.title,
          description: entryForm.description,
          score: entryForm.score,
          year: entryForm.year
        }]);

        toast.success("Entry saved!");
      }

      // Clear form and AI filled state
      setEntryForm({ title: "", description: "", score: 0, year: "" });
      setAiFilledFields(new Set());
      return true;
    } catch (err) {
      console.error("Failed to save entry:", err);
      toast.error("Failed to save entry");
      return false;
    } finally {
      setSavingEntry(false);
    }
  };

  // Handle editing an entry
  const handleEditEntry = (entry: SavedEntry) => {
    if (!entry.id) return;

    setEntryForm({
      title: entry.title,
      description: entry.description,
      score: entry.score,
      year: entry.year
    });
    setEditingEntryId(entry.id);
    setAiContext("Edit Entry");
    setFormCollapsed(false); // Expand form when editing
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      setSavedEntries(prev => prev.filter(e => e.id !== entryId));

      // If we were editing this entry, clear the form
      if (editingEntryId === entryId) {
        setEntryForm({ title: "", description: "", score: 0, year: "" });
        setEditingEntryId(null);
        setAiContext("New Entry");
      }

      toast.success("Entry deleted");
    } catch (err) {
      console.error("Failed to delete entry:", err);
      toast.error("Failed to delete entry");
    }
  };

  // Clear entry form
  const handleClearForm = () => {
    setEntryForm({ title: "", description: "", score: 0, year: "" });
    setEditingEntryId(null);
    setAiContext(lifelineSaved ? "New Entry" : "New Lifeline");
    setAiFilledFields(new Set());
  };

  const processToolCalls = async (toolCalls: ToolCall[]) => {
    for (const call of toolCalls) {
      if (call.name === "update_form_field") {
        const { field, value } = call.input as { field: string; value: string };

        // Track which fields AI has filled
        setAiFilledFields(prev => new Set(prev).add(field));

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
    setIsAiFilling(true); // Start filling indicator

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
      setIsAiFilling(false); // Stop filling indicator
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

  // Get score color class
  const getScoreColorClass = (score: number): string => {
    if (score > 0) return "bg-green-500";
    if (score < 0) return "bg-red-500";
    return "bg-gray-400";
  };

  // Format score for display
  const formatScore = (score: number): string => {
    if (score > 0) return `+${score}`;
    return String(score);
  };

  // Render the entry form fields (shared between lifeline and entry sections)
  const renderEntryFormFields = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
        <div>
          <Label className={mode === "ai" ? "text-sky-700 text-xs" : "text-xs"}>What happened?</Label>
          <Input
            value={entryForm.title}
            onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Entry title"
            disabled={!lifelineSaved}
            className={`${mode === "ai" ? "border-sky-300 focus:border-sky-500" : ""} ${aiFilledFields.has("entry_title") ? "bg-sky-50 border-sky-400" : ""}`}
          />
        </div>
        <div>
          <Label className={mode === "ai" ? "text-sky-700 text-xs" : "text-xs"}>When?</Label>
          <Input
            value={entryForm.year}
            onChange={(e) => setEntryForm(prev => ({ ...prev, year: e.target.value }))}
            placeholder="Date or year"
            disabled={!lifelineSaved}
            className={`${mode === "ai" ? "border-sky-300 focus:border-sky-500" : ""} ${aiFilledFields.has("entry_year") ? "bg-sky-50 border-sky-400" : ""}`}
          />
        </div>
      </div>

      <div>
        <Label className={mode === "ai" ? "text-sky-700 text-xs" : "text-xs"}>Tell the story</Label>
        <Textarea
          value={entryForm.description}
          onChange={(e) => setEntryForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What made this moment meaningful?"
          rows={3}
          disabled={!lifelineSaved}
          className={`${mode === "ai" ? "border-sky-300 focus:border-sky-500" : ""} ${aiFilledFields.has("entry_description") ? "bg-sky-50 border-sky-400" : ""}`}
        />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Label className={`${mode === "ai" ? "text-sky-700" : ""} text-xs whitespace-nowrap`}>How did it feel?</Label>
          <Slider
            value={[entryForm.score]}
            onValueChange={([v]) => setEntryForm(prev => ({ ...prev, score: v }))}
            min={-10}
            max={10}
            step={1}
            className="flex-1"
            disabled={!lifelineSaved}
          />
          <span className={`text-sm font-semibold min-w-[36px] text-right ${entryForm.score > 0 ? "text-green-600" : entryForm.score < 0 ? "text-red-600" : "text-gray-500"}`}>
            {formatScore(entryForm.score)}
          </span>
        </div>
      </div>
    </>
  );

  // Render the lifeline form fields
  const renderLifelineFormFields = () => (
    <>
      <div>
        <Label className={mode === "ai" ? "text-sky-700 text-xs" : "text-xs"}>Title</Label>
        <Input
          value={lifelineForm.title}
          onChange={(e) => setLifelineForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., My Career Journey"
          disabled={lifelineSaved}
          className={`${mode === "ai" ? "border-sky-300 focus:border-sky-500" : ""} ${aiFilledFields.has("title") ? "bg-sky-50 border-sky-400" : ""}`}
        />
      </div>

      <div>
        <Label className={mode === "ai" ? "text-sky-700 text-xs" : "text-xs"}>Type</Label>
        <Select
          value={lifelineForm.lifeline_type}
          onValueChange={(v) => setLifelineForm(prev => ({ ...prev, lifeline_type: v }))}
          disabled={lifelineSaved}
        >
          <SelectTrigger className={mode === "ai" ? "border-sky-300" : ""}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="person">Person (about me)</SelectItem>
            <SelectItem value="list">List (collection of things)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={mode === "ai" ? "text-sky-700 text-xs" : "text-xs"}>Purpose</Label>
        <Textarea
          value={lifelineForm.purpose}
          onChange={(e) => setLifelineForm(prev => ({ ...prev, purpose: e.target.value }))}
          placeholder="What is this lifeline about?"
          rows={2}
          disabled={lifelineSaved}
          className={`${mode === "ai" ? "border-sky-300 focus:border-sky-500" : ""} ${aiFilledFields.has("purpose") ? "bg-sky-50 border-sky-400" : ""}`}
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
    </>
  );

  // Render entries list with score circles
  const renderEntriesList = () => (
    <div className="space-y-2">
      {savedEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-3xl mb-2 opacity-50">📝</div>
          <p className="text-sm">No entries yet. Start telling your story!</p>
        </div>
      ) : (
        savedEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-colors group"
            onClick={() => handleEditEntry(entry)}
          >
            {/* Score Circle */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${getScoreColorClass(entry.score)}`}>
              {formatScore(entry.score)}
            </div>

            {/* Entry Details */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{entry.title}</div>
              <div className="text-xs text-muted-foreground">
                {entry.year ? formatDateForDisplay(parseDateInput(entry.year)) || entry.year : "No date"}
              </div>
            </div>

            {/* Edit/Delete Buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEntry(entry);
                }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (entry.id) handleDeleteEntry(entry.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Render chat panel
  const renderChatPanel = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Chat with AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
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
        <div className="flex gap-2 flex-shrink-0">
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
          Tip: You can also edit the form directly. Collapse it for more chat space.
        </p>
      </CardContent>
    </Card>
  );

  // Render AI form section (collapsible, blue-tinted)
  const renderAiFormSection = () => (
    <div className={`rounded-lg border transition-all ${mode === "ai" ? "bg-sky-50 border-sky-200" : "bg-white border-gray-200"} ${formCollapsed ? "bg-gray-50 border-gray-200" : ""}`}>
      {/* Collapsible Header */}
      <div
        className={`px-4 py-3 flex items-center gap-2 cursor-pointer rounded-t-lg transition-colors ${mode === "ai" && !formCollapsed ? "bg-sky-100 hover:bg-sky-200" : "bg-gray-100 hover:bg-gray-200"} ${formCollapsed ? "rounded-lg" : ""}`}
        onClick={() => setFormCollapsed(!formCollapsed)}
      >
        {/* AI Icon */}
        <span className={`text-base ${isAiFilling ? "animate-pulse" : ""}`}>✨</span>

        {/* Label */}
        <span className={`text-xs font-semibold uppercase tracking-wide ${mode === "ai" ? "text-sky-700" : "text-gray-600"}`}>
          AI Assisting
        </span>

        {/* Context */}
        <span className={`text-sm font-medium ${mode === "ai" ? "text-sky-900" : "text-gray-700"}`}>
          {aiContext}
        </span>

        {/* Filling Indicator */}
        {isAiFilling && (
          <div className="ml-auto flex items-center gap-1.5 bg-sky-200 text-sky-700 text-xs px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-ping"></span>
            Filling...
          </div>
        )}

        {/* Collapse Toggle */}
        <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0">
          {formCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Form Content (collapsible) */}
      {!formCollapsed && (
        <div className="p-4 space-y-3">
          {/* Hint text */}
          {mode === "ai" && (
            <div className="text-xs text-sky-700 bg-sky-100 px-3 py-2 rounded-md">
              AI is filling this form from your conversation. You can also type directly in any field.
            </div>
          )}

          {/* Show lifeline fields if not saved yet, otherwise entry fields */}
          {!lifelineSaved ? (
            renderLifelineFormFields()
          ) : (
            <>
              {renderEntryFormFields()}

              {/* Save/Clear buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleManualSaveEntry}
                  disabled={savingEntry || !entryForm.title}
                  className={`flex-1 ${mode === "ai" ? "bg-sky-600 hover:bg-sky-700" : ""}`}
                >
                  {savingEntry ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> {editingEntryId ? "Update Entry" : "Add Entry"}</>
                  )}
                </Button>
                {(entryForm.title || entryForm.description || editingEntryId) && (
                  <Button variant="outline" onClick={handleClearForm}>
                    Clear
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Render entries section
  const renderEntriesSection = () => (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg min-h-0 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="font-semibold text-sm">Your Entries</span>
        <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {savedEntries.length}
        </span>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderEntriesList()}
      </div>
    </div>
  );

  // Render form content for Direct Edit mode (non-collapsible)
  const renderDirectEditFormContent = () => {
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
      <div className="space-y-4">
        {/* Lifeline fields */}
        {renderLifelineFormFields()}

        {lifelineSaved && (
          <>
            {/* Divider */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">
                {editingEntryId ? "Edit Entry" : "Add an Entry"}
              </h3>
            </div>

            {renderEntryFormFields()}

            {/* Save Entry Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleManualSaveEntry}
                disabled={savingEntry || !entryForm.title}
                className="flex-1"
                variant="secondary"
              >
                {savingEntry ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> {editingEntryId ? "Update Entry" : "Add Entry"}</>
                )}
              </Button>
              {(entryForm.title || entryForm.description || editingEntryId) && (
                <Button variant="outline" onClick={handleClearForm}>
                  Clear
                </Button>
              )}
            </div>

            {/* Entries list */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Saved Entries</h3>
                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {savedEntries.length}
                </span>
              </div>
              {renderEntriesList()}
            </div>
          </>
        )}
      </div>
    );
  };

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

              {/* Mode toggle - with entry count badge */}
              <div className="flex bg-muted rounded-md p-0.5 relative">
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
                  className="text-xs px-2 lg:px-3 relative"
                  onClick={() => setMode("direct")}
                >
                  <span className="lg:hidden">Edit</span>
                  <span className="hidden lg:inline">Direct Edit</span>
                  {savedEntries.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                      {savedEntries.length}
                    </span>
                  )}
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

      {/* Main Content */}
      {mode === "ai" ? (
        // AI Assist Mode: Two-panel on desktop, scrollable on mobile
        <div className="max-w-6xl mx-auto p-4">
          {/* Desktop: Side by side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
            {/* Left: Chat */}
            {renderChatPanel()}

            {/* Right: Form + Entries stacked */}
            <div className="flex flex-col gap-3 h-full">
              {renderAiFormSection()}
              {renderEntriesSection()}
            </div>
          </div>

          {/* Mobile: Scrollable single column */}
          <div className="lg:hidden space-y-4">
            {/* Chat Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Chat with AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto pr-2">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-50 border border-blue-100 ml-4"
                          : "bg-white border mr-4"
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {msg.role === "user" ? "You" : "AI"}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {loading && (
                    <div className="bg-white border mr-4 p-3 rounded-lg flex items-center gap-2">
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
              </CardContent>
            </Card>

            {/* AI Form Section */}
            {renderAiFormSection()}

            {/* Entries Section */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm">Your Entries</span>
                <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {savedEntries.length}
                </span>
              </div>
              <div className="p-4">
                {renderEntriesList()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Direct Edit Mode: Single-column layout (720px max-width matching mockup)
        <div className="mx-auto p-4" style={{ maxWidth: '720px' }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {contentType === "lifelines" ? (editingEntryId ? "Edit Entry" : "New Lifeline") : `${contentTypeConfig[contentType].label} (Coming Soon)`}
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

              {renderDirectEditFormContent()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

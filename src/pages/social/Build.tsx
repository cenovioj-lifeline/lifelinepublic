import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2, Check, ChevronRight, Pencil, Trash2, Plus, Star, FileText } from "lucide-react";
import { toast } from "sonner";

// Card-style components
import { WaitingForIntent } from "@/components/social/WaitingForIntent";
import { LifelineCardForm } from "@/components/social/LifelineCardForm";
import { EntryCardForm } from "@/components/social/EntryCardForm";
import { LifelineInfoCard } from "@/components/social/LifelineInfoCard";

// Cascading dropdown components
import { TypeSelectorDropdown } from "@/components/social/TypeSelectorDropdown";
import { LifelineSelectorDropdown } from "@/components/social/LifelineSelectorDropdown";
import { LifelineSelectorSheet } from "@/components/social/LifelineSelectorSheet";

// State machine for AI chat
import {
  ChatState,
  getNextState,
  buildStateContext,
  validateResponse,
  fixResponse
} from "@/lib/chatStateContext";

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

type ContentType = "lifelines" | "entries";
type Mode = "ai" | "direct";
type AiIntent = "lifeline" | "entry" | null;

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

// Auto-resize textarea handler
const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
};

export default function Build() {
  const { collectionId } = useParams();
  const navigate = useNavigate();

  // UI State
  const [mode, setMode] = useState<Mode>("ai");
  const [contentType, setContentType] = useState<ContentType>("lifelines");

  // NEW: Selected lifeline state for Direct Edit mode
  const [selectedLifelineId, setSelectedLifelineId] = useState<string | null>(null);
  const [lifelineSelectorSheetOpen, setLifelineSelectorSheetOpen] = useState(false);

  // AI Intent State - null means waiting for intent
  const [aiIntent, setAiIntent] = useState<AiIntent>(null);

  // Chat State Machine
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [justSavedLifeline, setJustSavedLifeline] = useState(false);
  const [justSavedEntry, setJustSavedEntry] = useState(false);

  // AI Form UI State
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Direct Edit: editing lifeline mode
  const [isEditingLifeline, setIsEditingLifeline] = useState(false);

  // Simpler initial message - let state machine guide the conversation
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'll help you create a lifeline - a visual timeline of meaningful moments. What would you like to create?" }
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

  // Store existing lifeline title for context injection
  const [existingLifelineTitle, setExistingLifelineTitle] = useState<string | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Fetch ALL lifelines for this collection (for the selector dropdown)
  const { data: allLifelines, isLoading: lifelinesLoading } = useQuery({
    queryKey: ["allLifelines", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, lifeline_type, intro, cover_image_url")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collectionId
  });

  // Derived counts
  const lifelineCount = allLifelines?.length || 0;
  const totalEntryCount = savedEntries.length; // Current lifeline's entries

  // Update chat state when forms change
  useEffect(() => {
    const newState = getNextState(
      chatState,
      lifelineForm,
      entryForm,
      lifelineSaved,
      justSavedLifeline,
      justSavedEntry
    );
    if (newState !== chatState) {
      setChatState(newState);
    }
    // Clear the "just saved" flags after state update
    if (justSavedLifeline) setJustSavedLifeline(false);
    if (justSavedEntry) setJustSavedEntry(false);
  }, [lifelineForm, entryForm, lifelineSaved, justSavedLifeline, justSavedEntry, chatState]);

  // IMPORTANT: Clear transient state when switching modes
  // This prevents entry form data from bleeding between AI Assist and Direct Edit
  useEffect(() => {
    setEntryForm({ title: "", description: "", score: 0, year: "" });
    setEditingEntryId(null);
    setAiFilledFields(new Set());
  }, [mode]);

  // Load selected lifeline data when selection changes
  useEffect(() => {
    const loadSelectedLifeline = async () => {
      if (!selectedLifelineId) {
        // Clear form when no lifeline selected
        if (mode === "direct") {
          setLifelineId(null);
          setLifelineSaved(false);
          setLifelineForm({ title: "", lifeline_type: "", purpose: "" });
          setSavedEntries([]);
          setIsEditingLifeline(false);
        }
        return;
      }

      const { data } = await supabase
        .from("lifelines")
        .select("id, title, lifeline_type, intro")
        .eq("id", selectedLifelineId)
        .single();

      if (data) {
        setLifelineId(data.id);
        setLifelineSaved(true);
        setLifelineForm({
          title: data.title || "",
          lifeline_type: data.lifeline_type || "",
          purpose: data.intro || ""
        });
        setIsEditingLifeline(false);

        // Load entries for this lifeline
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
        } else {
          setSavedEntries([]);
        }
      }
    };

    loadSelectedLifeline();
  }, [selectedLifelineId, mode]);

  // Auto-select first lifeline when entering Direct Edit mode (if only one exists)
  useEffect(() => {
    if (mode === "direct" && allLifelines && allLifelines.length === 1 && !selectedLifelineId) {
      setSelectedLifelineId(allLifelines[0].id);
    }
  }, [mode, allLifelines, selectedLifelineId]);

  // Check for existing lifeline in this collection (for AI mode initial state)
  useEffect(() => {
    const checkExistingLifeline = async () => {
      if (!collectionId || mode !== "ai") return;

      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, lifeline_type, intro")
        .eq("collection_id", collectionId)
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setLifelineId(data.id);
        setLifelineSaved(true);
        setExistingLifelineTitle(data.title || undefined);
        setLifelineForm({
          title: data.title || "",
          lifeline_type: data.lifeline_type || "",
          purpose: data.intro || ""
        });
        // If lifeline exists, AI should know about entries
        setAiIntent("entry");
        setChatState('prompting_entries');

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
      // If no lifeline, aiIntent stays null (waiting for intent)
    };

    checkExistingLifeline();
  }, [collectionId, mode]);

  // Auto-scroll to bottom when messages change (with slight delay for render)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
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
      setSelectedLifelineId(data.id); // Auto-select the new lifeline
      setSavedEntries([]); // Clear entries from any previous lifeline
      setAiIntent("entry"); // After saving lifeline, intent becomes entry
      setJustSavedLifeline(true); // Trigger state transition to prompting_entries
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
      setJustSavedEntry(true); // Trigger state transition to entry_saved
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
    setAiIntent("entry"); // Ensure we're in entry mode
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
    setAiFilledFields(new Set());
  };

  // Handle creating new lifeline (resets state)
  const handleCreateNewLifeline = () => {
    setSelectedLifelineId(null);
    setLifelineId(null);
    setLifelineSaved(false);
    setLifelineForm({ title: "", lifeline_type: "", purpose: "" });
    setSavedEntries([]);
    setIsEditingLifeline(true); // Go into edit mode for the new lifeline
    setChatState('idle'); // Reset chat state
  };

  const processToolCalls = async (toolCalls: ToolCall[]) => {
    for (const call of toolCalls) {
      // Handle set_intent tool call
      if (call.name === "set_intent") {
        const { intent } = call.input as { intent: "lifeline" | "entry" };
        setAiIntent(intent);
      } else if (call.name === "update_form_field") {
        const { field, value } = call.input as { field: string; value: string };

        // Track which fields AI has filled
        setAiFilledFields(prev => new Set(prev).add(field));

        // Lifeline fields - also set intent to lifeline
        if (["title", "lifeline_type", "purpose"].includes(field)) {
          // CRITICAL: If AI is setting title and we have an existing lifeline loaded,
          // we're starting a NEW lifeline - clear the old state
          if (field === "title" && lifelineId) {
            setLifelineId(null);
            setLifelineSaved(false);
            setSavedEntries([]);
            setLifelineForm({ title: "", lifeline_type: "", purpose: "" });
            setChatState('gathering_lifeline');
          }
          
          if (aiIntent !== "lifeline" && !lifelineSaved) {
            setAiIntent("lifeline");
          }
          setLifelineForm(prev => ({ ...prev, [field]: value }));
        }
        // Entry fields - also set intent to entry
        else if (field === "entry_title") {
          if (aiIntent !== "entry" && lifelineSaved) {
            setAiIntent("entry");
          }
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
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setIsAiFilling(true);

    try {
      // Compute current state for context injection
      const currentState = getNextState(
        chatState,
        lifelineForm,
        entryForm,
        lifelineSaved,
        false,
        false
      );

      // Build state context to append to user message
      const stateContext = buildStateContext(
        currentState,
        lifelineForm,
        entryForm,
        existingLifelineTitle
      );

      // Append state context to user message for AI
      const messageWithContext = userMessage + stateContext;

      const { data, error } = await supabase.functions.invoke("ai-wizard", {
        body: {
          messages: [...messages, { role: "user", content: messageWithContext }],
          formState: {
            lifeline: lifelineForm,
            lifelineSaved: lifelineSaved,
            lifelineId: lifelineId,
            entry: entryForm,
            savedEntriesCount: savedEntries.length,
            chatState: currentState // Also pass state explicitly
          }
        }
      });

      if (error) throw error;

      // Process tool calls first (this may save to DB)
      if (data.toolCalls && data.toolCalls.length > 0) {
        await processToolCalls(data.toolCalls);
      }

      // Add assistant message with validation/fixing
      if (data.text) {
        let responseText = data.text;

        // Validate the response
        const validation = validateResponse(responseText);

        // Fix if needed (remove bullets, add missing question, etc.)
        if (validation.hasBulletList || validation.offersAlternatives || !validation.hasQuestion) {
          // Get the state AFTER tool calls may have changed things
          const postToolState = getNextState(
            chatState,
            lifelineForm,
            entryForm,
            lifelineSaved,
            justSavedLifeline,
            justSavedEntry
          );
          responseText = fixResponse(responseText, postToolState, validation);
        }

        setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
      }

    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Sorry, I encountered an error. Please try again.`
      }]);
    } finally {
      setLoading(false);
      setIsAiFilling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle example chip click in WaitingForIntent
  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  // Get score color class
  const getScoreColorClass = (score: number): string => {
    if (score > 0) return "bg-gradient-to-br from-green-500 to-green-600";
    if (score < 0) return "bg-gradient-to-br from-red-500 to-red-600";
    return "bg-gradient-to-br from-gray-400 to-gray-500";
  };

  // Format score for display
  const formatScore = (score: number): string => {
    if (score > 0) return `+${score}`;
    return String(score);
  };

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
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer transition-colors group"
            onClick={() => handleEditEntry(entry)}
          >
            {/* Score Circle */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getScoreColorClass(entry.score)}`}>
              {formatScore(entry.score)}
            </div>

            {/* Entry Details */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{entry.title}</div>
              <div className="text-xs text-muted-foreground">
                {entry.year ? formatDateForDisplay(parseDateInput(entry.year)) || entry.year : "No date"}
              </div>
            </div>

            {/* Edit/Delete Buttons - visible on hover (desktop) or always (mobile) */}
            <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
          {/* Debug: show current state */}
          {process.env.NODE_ENV === 'development' && (
            <span className="ml-auto text-xs font-normal text-gray-400">
              [{chatState}]
            </span>
          )}
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
        <div className="flex gap-2 flex-shrink-0 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTextareaResize(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            disabled={loading}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} className="h-10">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render AI Form Section (card-style, intent-aware)
  const renderAiFormSection = () => {
    // No intent yet - show waiting state
    if (aiIntent === null) {
      return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <WaitingForIntent onExampleClick={handleExampleClick} />
        </div>
      );
    }

    // Show lifeline form if creating new lifeline
    if (aiIntent === "lifeline" && !lifelineSaved) {
      return (
        <div className="space-y-3">
          {/* AI Assisting Header */}
          <div className="flex items-center gap-2 px-1">
            <Star className={`w-4 h-4 text-sky-600 ${isAiFilling ? "animate-pulse" : ""}`} />
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
              AI Assisting
            </span>
            <span className="text-sm font-medium text-sky-900">New Lifeline</span>
            {isAiFilling && (
              <div className="ml-auto flex items-center gap-1.5 bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-ping"></span>
                Filling...
              </div>
            )}
          </div>

          <LifelineCardForm
            form={lifelineForm}
            onChange={setLifelineForm}
            onSave={saveLifelineToDb}
            saving={savingLifeline}
            saved={lifelineSaved}
            aiFilledFields={aiFilledFields}
            isAiMode={true}
          />
        </div>
      );
    }

    // Show entry form if lifeline exists
    if (aiIntent === "entry" && lifelineSaved) {
      return (
        <div className="space-y-3">
          {/* AI Assisting Header */}
          <div className="flex items-center gap-2 px-1">
            <Star className={`w-4 h-4 text-sky-600 ${isAiFilling ? "animate-pulse" : ""}`} />
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
              AI Assisting
            </span>
            <span className="text-sm font-medium text-sky-900">
              {editingEntryId ? "Edit Entry" : "New Entry"}
            </span>
            {isAiFilling && (
              <div className="ml-auto flex items-center gap-1.5 bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-ping"></span>
                Filling...
              </div>
            )}
          </div>

          <EntryCardForm
            form={entryForm}
            onChange={setEntryForm}
            onSave={saveEntryToDb}
            onClear={handleClearForm}
            saving={savingEntry}
            disabled={false}
            isEditing={!!editingEntryId}
            aiFilledFields={aiFilledFields}
            isAiMode={true}
            lifelineTitle={lifelineForm.title}
          />
        </div>
      );
    }

    // Fallback: show waiting state
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <WaitingForIntent onExampleClick={handleExampleClick} />
      </div>
    );
  };

  // Render entries section
  const renderEntriesSection = () => (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl min-h-0 flex flex-col">
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

  // Render "No Lifeline Selected" state for Direct Edit
  const renderNoLifelineSelected = () => (
    <div className="max-w-md mx-auto p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Select a Lifeline</h3>
      <p className="text-gray-500 mb-6">
        Choose a lifeline from the dropdown above to start editing, or create a new one.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => setLifelineSelectorSheetOpen(true)}
          className="lg:hidden"
        >
          Browse Lifelines
        </Button>
        <Button onClick={handleCreateNewLifeline}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Lifeline
        </Button>
      </div>
    </div>
  );

  // Render Direct Edit Mode - Two Column Layout
  const renderDirectEditMode = () => {
    // If no lifeline selected and we have lifelines, show selection prompt
    if (!selectedLifelineId && contentType === "lifelines" && !isEditingLifeline) {
      return renderNoLifelineSelected();
    }

    return (
      <div className="max-w-6xl mx-auto p-4">
        {/* Desktop: Two columns | Mobile: Single column */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* LEFT COLUMN: Lifeline Card + Entry Form */}
          <div className="space-y-6">
            {/* Lifeline Info Card (or Form if editing/creating) */}
            {lifelineSaved && !isEditingLifeline ? (
              <LifelineInfoCard
                title={lifelineForm.title}
                description={lifelineForm.purpose}
                lifelineType={lifelineForm.lifeline_type}
                entryCount={savedEntries.length}
                onEditClick={() => setIsEditingLifeline(true)}
              />
            ) : (
              <LifelineCardForm
                form={lifelineForm}
                onChange={setLifelineForm}
                onSave={async () => {
                  await saveLifelineToDb();
                  setIsEditingLifeline(false);
                }}
                saving={savingLifeline}
                saved={false}
                isAiMode={false}
              />
            )}

            {/* Section Divider */}
            {lifelineSaved && (
              <>
                <div className="flex items-center gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span>Add New Entry</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Entry Form Card */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-gray-500" />
                      {editingEntryId ? "Edit Entry" : "New Entry"}
                    </span>
                    {(entryForm.title || entryForm.description || editingEntryId) && (
                      <Button variant="ghost" size="sm" onClick={handleClearForm}>
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Form Content */}
                  <div className="p-5">
                    <EntryCardForm
                      form={entryForm}
                      onChange={setEntryForm}
                      onSave={saveEntryToDb}
                      onClear={handleClearForm}
                      saving={savingEntry}
                      disabled={false}
                      isEditing={!!editingEntryId}
                      isAiMode={false}
                    />
                  </div>

                  {/* AI Hint */}
                  <div className="px-5 pb-5">
                    <div className="flex items-center justify-between gap-4 p-3 bg-sky-50 border border-sky-100 rounded-lg">
                      <span className="text-sm text-sky-700 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Want help filling this out?
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sky-700 border-sky-200 hover:bg-sky-100"
                        onClick={() => setMode("ai")}
                      >
                        AI Assist
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Entries List */}
          {lifelineSaved && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden h-fit lg:sticky lg:top-4">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold">Your Entries</span>
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {savedEntries.length}
                </span>
              </div>

              {/* Entries */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {renderEntriesList()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get selected lifeline title for mobile display
  const selectedLifelineTitle = allLifelines?.find(l => l.id === selectedLifelineId)?.title || "Select...";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-50">
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
            {/* Removed overflow-x-auto to prevent ugly scrollbar */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Mode toggle - added mr-1 to prevent badge clipping */}
              <div className="flex bg-muted rounded-md p-0.5 flex-shrink-0 mr-1">
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
                  <span className="lg:hidden">Direct</span>
                  <span className="hidden lg:inline">Direct Edit</span>
                  {savedEntries.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                      {savedEntries.length}
                    </span>
                  )}
                </Button>
              </div>

              {/* CASCADING DROPDOWNS - Only in Direct Edit mode */}
              {mode === "direct" && (
                <>
                  {/* Desktop: Inline dropdowns */}
                  <div className="hidden lg:flex items-center gap-2">
                    <TypeSelectorDropdown
                      value={contentType}
                      onChange={setContentType}
                      lifelineCount={lifelineCount}
                      entryCount={totalEntryCount}
                    />

                    <ChevronRight className="w-4 h-4 text-gray-300" />

                    {contentType === "lifelines" && (
                      <LifelineSelectorDropdown
                        lifelines={allLifelines || []}
                        selectedId={selectedLifelineId}
                        onSelect={setSelectedLifelineId}
                        onCreateNew={handleCreateNewLifeline}
                        loading={lifelinesLoading}
                      />
                    )}
                  </div>

                  {/* Mobile: Compact chips that open sheets */}
                  <div className="flex lg:hidden items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 px-2 h-8"
                      onClick={() => {/* Type selector - could add sheet for this too */}}
                    >
                      <span>📈</span>
                      <span className="text-xs">Lifelines</span>
                    </Button>

                    <ChevronRight className="w-3 h-3 text-gray-300" />

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 px-2 h-8 max-w-[120px]"
                      onClick={() => setLifelineSelectorSheetOpen(true)}
                    >
                      <span className="text-xs truncate">{selectedLifelineTitle}</span>
                    </Button>
                  </div>
                </>
              )}
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

      {/* Mobile Lifeline Selector Sheet */}
      <LifelineSelectorSheet
        open={lifelineSelectorSheetOpen}
        onOpenChange={setLifelineSelectorSheetOpen}
        lifelines={allLifelines || []}
        selectedId={selectedLifelineId}
        onSelect={setSelectedLifelineId}
        onCreateNew={handleCreateNewLifeline}
      />

      {/* Main Content */}
      {mode === "ai" ? (
        // AI Assist Mode: Chat + Card-style forms
        <div className="max-w-6xl mx-auto p-4">
          {/* Desktop: Side by side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
            {/* Left: Chat */}
            {renderChatPanel()}

            {/* Right: Form + Entries stacked */}
            <div className="flex flex-col gap-4 h-full overflow-y-auto">
              {renderAiFormSection()}
              {lifelineSaved && renderEntriesSection()}
            </div>
          </div>

          {/* Mobile: Scrollable single column */}
          <div className="lg:hidden space-y-4">
            {/* Chat Section (collapsible on mobile when form is showing) */}
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
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      handleTextareaResize(e);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    disabled={loading}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                  />
                  <Button onClick={sendMessage} disabled={loading || !input.trim()} className="h-10">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Form Section */}
            {renderAiFormSection()}

            {/* Entries Section */}
            {lifelineSaved && (
              <div className="bg-white border border-gray-200 rounded-xl">
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
            )}
          </div>
        </div>
      ) : (
        // Direct Edit Mode: Two-column layout
        renderDirectEditMode()
      )}
    </div>
  );
}

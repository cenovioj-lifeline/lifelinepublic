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
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

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
  title: string;
  description: string;
  score: number;
  year: string;
}

export default function Build() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  
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
  const [lifelineSaved, setLifelineSaved] = useState(false);
  
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processToolCalls = (toolCalls: ToolCall[]) => {
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
      } else if (call.name === "save_entry" && (call.input as { confirm: boolean }).confirm) {
        // Save current entry to list
        if (entryForm.title) {
          setSavedEntries(prev => [...prev, { ...entryForm }]);
          // Clear entry form
          setEntryForm({ title: "", description: "", score: 0, year: "" });
        }
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
            entry: entryForm,
            savedEntries: savedEntries.length
          }
        }
      });

      if (error) throw error;

      // Process tool calls first
      if (data.toolCalls && data.toolCalls.length > 0) {
        processToolCalls(data.toolCalls);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="font-semibold">{collection?.title || "Building Your Collection"}</h1>
            <p className="text-sm text-muted-foreground">AI-Assisted Creation</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Chat Panel */}
          <Card className="h-[calc(100vh-140px)] flex flex-col">
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
              <p className="text-xs text-muted-foreground mt-2">
                Tip: You can also edit the form directly on the right.
              </p>
            </CardContent>
          </Card>

          {/* Form Panel */}
          <Card className="h-[calc(100vh-140px)] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Lifeline Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lifeline fields */}
              <div>
                <Label>Title</Label>
                <Input 
                  value={lifelineForm.title} 
                  onChange={(e) => setLifelineForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., My Career Journey"
                />
              </div>
              
              <div>
                <Label>Type</Label>
                <Select 
                  value={lifelineForm.lifeline_type} 
                  onValueChange={(v) => setLifelineForm(prev => ({ ...prev, lifeline_type: v }))}
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
                />
              </div>

              {/* Divider */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Add an Entry</h3>
              </div>
              
              <div>
                <Label>What happened?</Label>
                <Input 
                  value={entryForm.title}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Entry title"
                />
              </div>
              
              <div>
                <Label>Tell the story</Label>
                <Textarea 
                  value={entryForm.description}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What made this moment meaningful?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>How did it feel? ({entryForm.score})</Label>
                <Slider
                  value={[entryForm.score]}
                  onValueChange={([v]) => setEntryForm(prev => ({ ...prev, score: v }))}
                  min={-10}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-10 (terrible)</span>
                  <span>0 (neutral)</span>
                  <span>+10 (amazing)</span>
                </div>
              </div>
              
              <div>
                <Label>When did it happen?</Label>
                <Input 
                  value={entryForm.year}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="e.g., 2020 or June 2020"
                />
              </div>

              {/* Saved entries preview */}
              {savedEntries.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">Saved Entries ({savedEntries.length})</h3>
                  <div className="space-y-2">
                    {savedEntries.map((entry, i) => (
                      <div key={i} className="bg-green-50 border border-green-100 p-2 rounded text-sm">
                        <strong>{entry.title}</strong>
                        {entry.year && <span className="text-muted-foreground"> ({entry.year})</span>}
                        <span className="ml-2 text-xs">Score: {entry.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

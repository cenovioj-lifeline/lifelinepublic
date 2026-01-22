import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FormState {
  title: string;
  lifeline_type: string;
  purpose: string;
  entry_title: string;
  entry_description: string;
  entry_score: number;
  entry_year: string;
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export default function Spike() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    title: "",
    lifeline_type: "",
    purpose: "",
    entry_title: "",
    entry_description: "",
    entry_score: 0,
    entry_year: ""
  });
  const [savedEntries, setSavedEntries] = useState<Array<{ title: string; description: string; score: number; year: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processToolCalls = (toolCalls: ToolCall[]) => {
    for (const call of toolCalls) {
      if (call.name === "update_form_field") {
        const { field, value } = call.input as { field: string; value: string };
        setFormState(prev => ({
          ...prev,
          [field]: field === "entry_score" ? parseInt(value) : value
        }));
      } else if (call.name === "save_entry" && (call.input as { confirm: boolean }).confirm) {
        // Save current entry
        setSavedEntries(prev => [...prev, {
          title: formState.entry_title,
          description: formState.entry_description,
          score: formState.entry_score,
          year: formState.entry_year
        }]);
        // Clear entry fields
        setFormState(prev => ({
          ...prev,
          entry_title: "",
          entry_description: "",
          entry_score: 0,
          entry_year: ""
        }));
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
          formState
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
        content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">AI Wizard Spike</h1>
        <p className="text-gray-600 mb-4">Testing Claude API with tool use. Chat on the left, form updates on the right.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chat Panel */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Start by telling me about a lifeline you'd like to create!
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${msg.role === "user" 
                      ? "bg-blue-100 ml-8" 
                      : "bg-gray-200 mr-8"
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {msg.role === "user" ? "You" : "AI"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {loading && (
                  <div className="bg-gray-200 mr-8 p-3 rounded-lg">
                    <p className="text-gray-500">Thinking...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Panel */}
          <Card className="h-[600px] overflow-y-auto">
            <CardHeader>
              <CardTitle>Lifeline Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lifeline fields */}
              <div>
                <Label>Title</Label>
                <Input 
                  value={formState.title} 
                  onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., My Career Journey"
                />
              </div>
              
              <div>
                <Label>Type</Label>
                <Select 
                  value={formState.lifeline_type} 
                  onValueChange={(v) => setFormState(prev => ({ ...prev, lifeline_type: v }))}
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
                  value={formState.purpose}
                  onChange={(e) => setFormState(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="What is this lifeline about?"
                  rows={2}
                />
              </div>

              <hr className="my-4" />
              
              {/* Entry fields */}
              <h3 className="font-semibold">Current Entry</h3>
              
              <div>
                <Label>Entry Title</Label>
                <Input 
                  value={formState.entry_title}
                  onChange={(e) => setFormState(prev => ({ ...prev, entry_title: e.target.value }))}
                  placeholder="What happened?"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formState.entry_description}
                  onChange={(e) => setFormState(prev => ({ ...prev, entry_description: e.target.value }))}
                  placeholder="Tell the story..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Score: {formState.entry_score}</Label>
                <Slider
                  value={[formState.entry_score]}
                  onValueChange={([v]) => setFormState(prev => ({ ...prev, entry_score: v }))}
                  min={-10}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-10 (terrible)</span>
                  <span>+10 (amazing)</span>
                </div>
              </div>
              
              <div>
                <Label>Year</Label>
                <Input 
                  value={formState.entry_year}
                  onChange={(e) => setFormState(prev => ({ ...prev, entry_year: e.target.value }))}
                  placeholder="e.g., 2020"
                />
              </div>

              {/* Saved entries */}
              {savedEntries.length > 0 && (
                <>
                  <hr className="my-4" />
                  <h3 className="font-semibold">Saved Entries ({savedEntries.length})</h3>
                  <div className="space-y-2">
                    {savedEntries.map((entry, i) => (
                      <div key={i} className="bg-green-50 p-2 rounded text-sm">
                        <strong>{entry.title}</strong> ({entry.year}) - Score: {entry.score}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

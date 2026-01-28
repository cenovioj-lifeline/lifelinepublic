// AI Wizard Edge Function - v4 (Aggressive Brevity)
// Deploy to: supabase/functions/ai-wizard/index.ts
//
// CHANGES FROM v3:
// - Rules FIRST before any context
// - Explicit FORBIDDEN section with examples
// - Shorter overall prompt
// - "Before you respond" checklist
// - Removed explanatory text that was being ignored

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tools = [
  {
    name: "update_form_field",
    description: "Update a field in the lifeline creation form. Use this when the user provides information that should be captured in the form.",
    input_schema: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["title", "lifeline_type", "purpose", "entry_title", "entry_description", "entry_score", "entry_year"],
          description: "The form field to update"
        },
        value: {
          type: "string",
          description: "The value to set"
        }
      },
      required: ["field", "value"]
    }
  },
  {
    name: "save_lifeline",
    description: "Save the lifeline to the database. Use this once the user has confirmed the lifeline title, type, and purpose. This creates the lifeline so entries can be added to it.",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "Confirm saving the lifeline"
        }
      },
      required: ["confirm"]
    }
  },
  {
    name: "save_entry",
    description: "Save the current entry to the lifeline. Use this when the user has provided enough information for a complete entry (title, description, score, and year).",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "Confirm saving the entry"
        }
      },
      required: ["confirm"]
    }
  }
];

const systemPrompt = `BEFORE YOU RESPOND, CHECK:
[ ] Is my response 1-2 sentences? (If no, shorten it)
[ ] Am I asking exactly ONE question? (If no, remove extras)
[ ] Did I use a bullet list? (If yes, remove it and write prose)
[ ] If user stated intent, am I doing it? (Don't offer alternatives)

FORBIDDEN - Never do these:
- Bullet lists or numbered lists (write short prose instead)
- Multiple questions in one response
- "Would you like to X or Y?" when user already said what they want
- Ending without a question or next step
- Responses longer than 2 sentences

EXAMPLES OF WRONG vs RIGHT:

User: "I want to create a new lifeline"
WRONG: "I see you have an existing lifeline. Would you like to add to it or create new?"
RIGHT: "Great! What do you want to call it?"

User: "TestLifeline"
WRONG: "Perfect! Let me set that up for you."
RIGHT: "Got it! What's this lifeline about in one sentence?"

After saving lifeline:
WRONG: "Your lifeline is saved!"
RIGHT: "Saved! Entries are the moments in your story. What's one that stands out?"

YOUR JOB:
Help users create lifelines (timelines of moments scored -10 to +10).

FLOW:
1. Get lifeline name → "What do you want to call it?"
2. Get purpose → "What's it about?"
3. Save lifeline → Explain entries, ask for first one
4. For entries: get title, description, score, year (one at a time)
5. Save entry → Ask for next one

SCORING: -10 (worst) to +10 (best). Score feelings, not importance.

TONE: Warm, brief, curious. Not cheesy.

Form state is provided. Use it to know what's filled.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { messages, formState } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messagesWithContext = messages.map((msg: { role: string; content: string }, i: number) => {
      if (i === messages.length - 1 && msg.role === "user") {
        return {
          ...msg,
          content: `${msg.content}\n\n[Form state: ${JSON.stringify(formState || {})}]`
        };
      }
      return msg;
    });

    console.log("Calling Claude API with", messagesWithContext.length, "messages");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,  // Reduced from 1500 to discourage long responses
        system: systemPrompt,
        tools: tools,
        messages: messagesWithContext
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Claude response:", JSON.stringify(data).substring(0, 500));

    let text = "";
    const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];

    for (const block of data.content) {
      if (block.type === "text") {
        text += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name,
          input: block.input
        });
      }
    }

    return new Response(
      JSON.stringify({
        text,
        toolCalls,
        stopReason: data.stop_reason
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-wizard error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

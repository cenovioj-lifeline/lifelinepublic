import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for Claude
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

const systemPrompt = `You help users create lifelines - visual timelines of meaningful moments scored from -10 to +10.

## BREVITY RULES (CRITICAL)
- Maximum 2-3 sentences per response
- ONE question at a time - never ask multiple questions
- No bullet lists unless user explicitly asks for options
- Get to the point immediately

## AFTER EVERY TOOL USE (NON-NEGOTIABLE)
In 1-2 sentences total, you MUST:
1. Confirm what happened
2. Provide the next step with ONE question

WRONG: "Perfect! Your lifeline is ready." [stops]
RIGHT: "Saved! Now let's add entries - the moments that make up your story. What's one that stands out?"

## WORKFLOW

### Creating a Lifeline
Ask ONE question at a time:
1. "What do you want to call this lifeline?"
2. "What's it about in one sentence?"
3. Use save_lifeline → then teach about entries

### After Saving Lifeline (ALWAYS DO THIS)
Teach the system: "Entries are the moments that make up your lifeline - think of them as chapters in your story."
Then ask for their first entry.

### Adding Entries
For each entry, gather: title, description, score (-10 to +10), year.
Ask naturally, one piece at a time. Use save_entry when complete.

## SCORING
+10: Peak joy (birth of child, dream achieved)
+5 to +9: Major positive
0: Neutral
-5 to -9: Major negative
-10: Worst moment

Score what it FELT like, not what it "should" be.

## QUALITY NUDGES (use sparingly)
- Vague entry: "Can you make this a specific moment?"
- Missing emotion: "How did it feel?"
- Score mismatch: "You described this as [X] but scored it [Y]. Want to adjust?"

## TONE
Warm and curious. Encouraging but not cheesy. Never say "OMG" or "so brave."

Current form state will be provided. Use it to know what's filled and what's missing.`;

serve(async (req) => {
  // Handle CORS preflight
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

    // Add form state context to the last user message
    const messagesWithContext = messages.map((msg: { role: string; content: string }, i: number) => {
      if (i === messages.length - 1 && msg.role === "user") {
        return {
          ...msg,
          content: `${msg.content}\n\n[Current form state: ${JSON.stringify(formState || {})}]`
        };
      }
      return msg;
    });

    console.log("Calling Claude API with", messagesWithContext.length, "messages");

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
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

    // Extract text and tool calls from response
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

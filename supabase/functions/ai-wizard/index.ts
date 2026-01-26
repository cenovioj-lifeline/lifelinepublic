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

const systemPrompt = `You are a warm, curious guide helping users create their personal lifeline - a visual timeline of meaningful moments scored from -10 to +10.

## Your Role
You're a thinking partner, not a form-filler. You help people say things they don't normally get permission to say. Be encouraging but never cheesy. Push for depth without shaming.

## CRITICAL: Never Leave Users Hanging
After EVERY tool use, you MUST:
1. CONFIRM what happened ("I've saved your lifeline" / "I've added that entry")
2. EXPLAIN what changed ("Your lifeline is ready for entries" / "That's entry #4")
3. PROVIDE next steps (a question, suggestion, or invitation to continue)

The user should NEVER wonder "Did it work?" or "What now?"

## Workflow

### Phase 1: Set up the lifeline
Gather: title, type (person/list), and purpose. Be conversational - don't rapid-fire questions.
- Ask what the lifeline is about
- Understand why it matters to them
- Use update_form_field as they share info

Once title, type, and purpose are filled → use save_lifeline → then transition to entries.

### Phase 2: Add entries
For each entry, gather: title, description, score (-10 to +10), and year.
- Draw out the story - ask "what happened?" and "why did it matter?"
- Help them find the right score
- Use save_entry when complete → confirm it → invite the next

## Scoring Guide (-10 to +10)
+10: Peak moment, transcendent joy (birth of child, dream achieved)
+7 to +9: Major positive (landing dream job, falling in love)
+4 to +6: Significant positive (good promotion, relationship milestone)
+1 to +3: Mild positive (nice vacation, small win)
0: Neutral
-1 to -3: Mild negative (frustration, minor setback)
-4 to -6: Significant negative (breakup, job loss)
-7 to -9: Very hard (death of someone close)
-10: Worst moment (life-changing devastation)

IMPORTANT: Score what it FELT like, not what it "should" be. A wedding might be +4 if it was stressful. Getting fired might be +2 if you hated that job. Lows show resilience.

## Quality Guidance
If entries are vague: "Can you turn this into a specific moment? Like 'The Day Everything Changed'?"
If missing emotion: "You've described what happened. Can you add how it felt?"
If score seems off: "You described this as devastating but scored it -3. Want to revisit?"
If all positive: "Great highs! Are there any hard moments that shaped you too?"
If all negative: "You've been through a lot. Any bright spots that helped you get through?"

## Form Fields
- title: Lifeline name (e.g., "My Career Journey", "Cars I've Owned")
- lifeline_type: "person" (about themselves) or "list" (collection of things)
- purpose: What this lifeline is about and why it matters
- entry_title: Short, evocative name for this moment
- entry_description: 2-5 sentences about what happened and why it mattered
- entry_score: -10 to +10 reflecting emotional impact
- entry_year: When it happened (YYYY or approximate like "early 2010s")

## Tone
- Warm and curious, never clinical
- Encouraging without being performative ("That's meaningful" not "OMG so brave!")
- Gently challenging when needed
- "Thank you for sharing that" > "You're so brave!"

## Good Phrases
- "What made this moment different from similar ones?"
- "If you had to explain why this matters - what would you say?"
- "You're building something most people never take time to build."
- "This is exactly the kind of moment people think about for years but never write down."

## After Tool Use Examples

After save_lifeline:
"Done! Your lifeline '[title]' is saved and ready.

Now let's capture your first moment. Think about this: what's an event from [topic] that still lives in your memory? It could be a high, a low, or just a turning point."

After save_entry:
"That's captured! [Brief acknowledgment of what they shared]

What comes to mind next? Another moment from this story, or should we explore a different angle?"

Current form state will be provided. Use it to know what's been filled and what's missing.`;

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

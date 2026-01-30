// AI Wizard Edge Function - v5 (State Machine Integration)
// Deploy to: supabase/functions/ai-wizard/index.ts
//
// CHANGES FROM v4:
// - MUCH simpler prompt - state machine in frontend handles complexity
// - AI just follows the STATE instruction injected into each message
// - Frontend validates and fixes responses, so rules here are backup
// - Reduced from 50 lines of rules to ~15 lines

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tools = [
  {
    name: "update_form_field",
    description: "Update a field in the form. Use this when the user provides information.",
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
    description: "Save the lifeline. Use when title and purpose are filled.",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "Confirm saving"
        }
      },
      required: ["confirm"]
    }
  },
  {
    name: "save_entry",
    description: "Save the entry. Use when title, description, score, and year are filled.",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "Confirm saving"
        }
      },
      required: ["confirm"]
    }
  }
];

// Simple prompt - state machine sends specific instructions with each message
const systemPrompt = `You help users create lifelines (timelines of moments scored -10 to +10).

CRITICAL RULES:
1. Follow the STATE instruction in each message - it tells you exactly what to do
2. Keep responses to 1-2 sentences
3. Ask ONE question at a time
4. NO bullet lists
5. If user states clear intent, DO IT - don't offer alternatives

When user provides information, extract it and call update_form_field.
When all required fields are filled (check MISSING_FIELDS), call save_lifeline or save_entry.

SCORING GUIDE (for entries):
+10 = peak joy (birth of child, dream achieved)
+5 to +9 = major positive
0 = neutral
-5 to -9 = major negative
-10 = worst moment
Score how it FELT, not importance.

Be warm and curious. Not cheesy.`;

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

    // The last user message already has state context appended by frontend
    // Just pass it through - no need to add more context here
    console.log("Calling Claude API with", messages.length, "messages");
    console.log("Form state:", JSON.stringify(formState));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,  // Even shorter - state machine keeps things focused
        system: systemPrompt,
        tools: tools,
        messages: messages
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

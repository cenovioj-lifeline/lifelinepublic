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
    name: "save_entry",
    description: "Save the current entry to the lifeline. Use this when the user has provided enough information for a complete entry.",
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

const systemPrompt = `You are a friendly AI assistant helping users create their personal lifeline - a visual timeline of meaningful moments in their life.

Your job is to:
1. Have a natural conversation to understand what moments they want to capture
2. Use the update_form_field tool to populate the form as they share information
3. Use save_entry when they've described a complete moment

Form fields you can update:
- title: The lifeline's title (e.g., "My Career Journey", "Adventures in Cooking")
- lifeline_type: Either "person" (about themselves) or "list" (a collection of things)
- purpose: A brief description of what this lifeline is about
- entry_title: Title for a specific moment/event
- entry_description: The story behind that moment
- entry_score: How positive/negative (-10 to +10)
- entry_year: When it happened

Be conversational and encouraging. Draw out details about their experiences. When they share a moment, extract the key information and update the form fields.

Current form state will be provided in the user message.`;

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
        max_tokens: 1024,
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

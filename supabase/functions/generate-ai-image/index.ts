import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const { prompt, sourceImageUrl, entryId } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Determine mode and build message content
    const isEditing = !!sourceImageUrl;
    let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

    if (isEditing) {
      // EDITING MODE: Include both text instruction and source image
      messageContent = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: sourceImageUrl } }
      ];
      console.log(`Editing image for entry ${entryId || 'unknown'}: "${prompt.substring(0, 100)}..."`);
    } else {
      // GENERATION MODE: Text prompt only
      messageContent = prompt;
      console.log(`Generating image for entry ${entryId || 'unknown'}: "${prompt.substring(0, 100)}..."`);
    }

    // 4. Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        modalities: ["image", "text"],
      })
    });

    // Handle AI gateway errors
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI gateway error: ${aiResponse.status} - ${errorText}`);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Out of AI credits. Add credits in Lovable settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();

    // 5. Extract base64 image from response
    const images = aiData.choices?.[0]?.message?.images;
    if (!images || images.length === 0) {
      console.error("No image in AI response:", JSON.stringify(aiData).substring(0, 500));
      throw new Error("No image generated in response");
    }

    const imageDataUrl = images[0].image_url.url;  // "data:image/png;base64,..."

    // Parse the data URL
    const matches = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = matches[1];  // "png", "jpeg", etc.
    const base64Data = matches[2];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    console.log(`Image ${isEditing ? 'edited' : 'generated'} successfully, format: ${imageFormat}, size: ${imageBuffer.length} bytes`);

    // 6. Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const filename = `ai-generated-${crypto.randomUUID()}.${imageFormat}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media-uploads")
      .upload(filename, imageBuffer, {
        contentType: `image/${imageFormat}`,
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 7. Get public URL
    const { data: urlData } = supabase.storage
      .from("media-uploads")
      .getPublicUrl(filename);

    console.log(`Image uploaded successfully: ${filename}`);

    // 8. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: urlData.publicUrl,
        path: filename,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-ai-image error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: `Failed to generate image: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

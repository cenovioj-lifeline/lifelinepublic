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

    // 2. Parse request body - now includes experimental size/aspect params
    const { prompt, sourceImageUrl, entryId, imageSize, aspectRatio } = await req.json();

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

    // 4. Build request body with experimental parameters
    const requestBody: Record<string, unknown> = {
      model: "google/gemini-3-pro-image-preview",
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ],
      modalities: ["image", "text"],
    };

    // Add experimental size/aspect parameters if provided
    // Testing multiple possible parameter names
    if (imageSize) {
      requestBody.image_size = imageSize;      // OpenAI style
      requestBody.size = imageSize;            // Alternative
    }
    if (aspectRatio) {
      requestBody.aspect_ratio = aspectRatio;  // Snake case
      requestBody.aspectRatio = aspectRatio;   // Camel case
    }

    // Log what we're sending
    console.log("=== AI Gateway Request ===");
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    console.log("Requested imageSize:", imageSize || 'not specified');
    console.log("Requested aspectRatio:", aspectRatio || 'not specified');

    // 5. Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    // Handle AI gateway errors
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI gateway error: ${aiResponse.status}`);
      console.error(`Error response body:`, errorText);
      
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

    // Log full response structure for analysis
    console.log("=== AI Gateway Response ===");
    console.log("Response model:", aiData.model);
    console.log("Response usage:", JSON.stringify(aiData.usage));
    console.log("Image count:", aiData.choices?.[0]?.message?.images?.length || 0);
    console.log("Response metadata:", JSON.stringify(aiData.metadata || 'none'));
    console.log("Full response keys:", Object.keys(aiData));
    
    // Check for any size-related info in the response
    if (aiData.choices?.[0]?.message) {
      const message = aiData.choices[0].message;
      console.log("Message keys:", Object.keys(message));
      if (message.images?.[0]) {
        const imageInfo = message.images[0];
        console.log("Image object keys:", Object.keys(imageInfo));
        console.log("Image URL type:", imageInfo.image_url ? Object.keys(imageInfo.image_url) : 'no image_url');
      }
    }

    // 6. Extract base64 image from response
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

    console.log(`Image ${isEditing ? 'edited' : 'generated'} successfully`);
    console.log(`Format: ${imageFormat}, Size: ${imageBuffer.length} bytes`);
    
    // Try to determine actual image dimensions from the data
    // PNG: width at bytes 16-19, height at bytes 20-23 (big endian)
    // JPEG: more complex, skip for now
    let actualWidth: number | null = null;
    let actualHeight: number | null = null;
    
    if (imageFormat === 'png' && imageBuffer.length > 24) {
      actualWidth = (imageBuffer[16] << 24) | (imageBuffer[17] << 16) | (imageBuffer[18] << 8) | imageBuffer[19];
      actualHeight = (imageBuffer[20] << 24) | (imageBuffer[21] << 16) | (imageBuffer[22] << 8) | imageBuffer[23];
      console.log(`Detected PNG dimensions: ${actualWidth}x${actualHeight}`);
    }

    // 7. Upload to Supabase Storage
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

    // 8. Get public URL
    const { data: urlData } = supabase.storage
      .from("media-uploads")
      .getPublicUrl(filename);

    console.log(`Image uploaded successfully: ${filename}`);

    // 9. Return success response with diagnostic info
    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        path: filename,
        // Diagnostic info for testing
        diagnostics: {
          requestedSize: imageSize || 'not specified',
          requestedAspect: aspectRatio || 'not specified',
          actualDimensions: actualWidth && actualHeight ? `${actualWidth}x${actualHeight}` : 'unknown',
          fileSizeBytes: imageBuffer.length,
          format: imageFormat,
          model: aiData.model,
        }
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

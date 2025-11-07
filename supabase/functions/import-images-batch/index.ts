import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageImportRequest {
  entryId: string;
  imageUrl: string;
  altText?: string;
  orderIndex?: number;
  position?: {
    x?: number;
    y?: number;
    scale?: number;
  };
}

interface ImageImportResult {
  entryId: string;
  status: 'success' | 'failed' | 'skipped';
  mediaId?: string;
  entryMediaId?: string;
  orderIndex?: number;
  error?: string;
}

async function importSingleImage(
  supabaseClient: any,
  request: ImageImportRequest
): Promise<ImageImportResult> {
  const { entryId, imageUrl, altText, orderIndex, position } = request;

  try {
    console.log(`Processing image for entry ${entryId}: ${imageUrl}`);

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return {
        entryId,
        status: 'failed',
        error: `Failed to download image: HTTP ${imageResponse.status}`
      };
    }

    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return {
        entryId,
        status: 'failed',
        error: `Invalid content type: ${contentType}`
      };
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Generate a unique filename
    const fileExt = contentType.split('/')[1].split(';')[0];
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `imported/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('media-uploads')
      .upload(filePath, imageBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(`Upload error for entry ${entryId}:`, uploadError);
      return {
        entryId,
        status: 'failed',
        error: `Storage upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('media-uploads')
      .getPublicUrl(filePath);

    // Create media_assets record
    const { data: mediaAsset, error: mediaError } = await supabaseClient
      .from('media_assets')
      .insert({
        url: urlData.publicUrl,
        storage_path: filePath,
        alt_text: altText || '',
        mime_type: contentType,
      })
      .select()
      .single();

    if (mediaError) {
      console.error(`Media asset creation error for entry ${entryId}:`, mediaError);
      // Clean up uploaded file
      await supabaseClient.storage.from('media-uploads').remove([filePath]);
      return {
        entryId,
        status: 'failed',
        error: `Database error: ${mediaError.message}`
      };
    }

    // Determine order index
    let finalOrderIndex = orderIndex ?? 0;
    
    // Check if order index is already taken
    const { data: existingMedia } = await supabaseClient
      .from('entry_media')
      .select('order_index')
      .eq('entry_id', entryId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (existingMedia && existingMedia.length > 0) {
      const maxOrderIndex = existingMedia[0].order_index;
      // If specified order index conflicts, use next available
      if (orderIndex !== undefined && orderIndex <= maxOrderIndex) {
        finalOrderIndex = maxOrderIndex + 1;
      }
    }

    // Create entry_media link
    const { data: entryMedia, error: linkError } = await supabaseClient
      .from('entry_media')
      .insert({
        entry_id: entryId,
        media_id: mediaAsset.id,
        order_index: finalOrderIndex,
        position_x: position?.x ?? 50,
        position_y: position?.y ?? 50,
        scale: position?.scale ?? 1.0,
        locked: false
      })
      .select()
      .single();

    if (linkError) {
      console.error(`Entry media link error for entry ${entryId}:`, linkError);
      return {
        entryId,
        status: 'failed',
        error: `Failed to link image to entry: ${linkError.message}`
      };
    }

    console.log(`Successfully imported image for entry ${entryId}`);
    return {
      entryId,
      status: 'success',
      mediaId: mediaAsset.id,
      entryMediaId: entryMedia.id,
      orderIndex: finalOrderIndex
    };

  } catch (error: any) {
    console.error(`Unexpected error for entry ${entryId}:`, error);
    return {
      entryId,
      status: 'failed',
      error: error?.message || 'Unknown error'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'images array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (images.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Maximum 50 images per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting batch import of ${images.length} images`);

    // Process all images (continue on individual failures)
    const results: ImageImportResult[] = [];
    
    for (const imageRequest of images) {
      const result = await importSingleImage(supabaseClient, imageRequest);
      results.push(result);
    }

    // Calculate summary
    const succeeded = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const response = {
      success: true,
      results,
      summary: {
        total: images.length,
        succeeded,
        failed,
        skipped
      }
    };

    console.log(`Batch import complete: ${succeeded}/${images.length} succeeded`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in import-images-batch function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

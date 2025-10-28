import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ImportImageRequest {
  entryId: string;
  imageUrl?: string;
  altText?: string;
  orderIndex?: number;
  position?: {
    x?: number;
    y?: number;
    scale?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ImportImageRequest = await req.json();
    const { entryId, imageUrl, altText, orderIndex = 0, position } = body;

    console.log('Import image request:', { entryId, imageUrl });

    if (!entryId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'entryId and imageUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the image from the URL
    console.log('Fetching image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status);
      return new Response(
        JSON.stringify({ error: `Failed to fetch image: ${imageResponse.statusText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate content type
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Invalid content type:', contentType);
      return new Response(
        JSON.stringify({ error: 'URL does not point to a valid image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get image data as blob
    const imageBlob = await imageResponse.blob();
    
    // Generate unique filename
    const fileExt = contentType.split('/')[1] || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading to storage:', filePath);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('media-uploads')
      .upload(filePath, imageBlob, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: `Failed to upload image: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media-uploads')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('Image uploaded successfully:', publicUrl);

    // Insert into media_assets
    const { data: mediaAsset, error: mediaError } = await supabase
      .from('media_assets')
      .insert({
        filename: fileName,
        url: publicUrl,
        type: 'image',
        alt_text: altText || '',
        position_x: position?.x ?? 50,
        position_y: position?.y ?? 50,
        scale: position?.scale ?? 1.0,
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Media asset insert error:', mediaError);
      // Clean up uploaded file
      await supabase.storage.from('media-uploads').remove([filePath]);
      return new Response(
        JSON.stringify({ error: `Failed to create media asset: ${mediaError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into entry_media to link the image to the entry
    const { error: linkError } = await supabase
      .from('entry_media')
      .insert({
        entry_id: entryId,
        media_id: mediaAsset.id,
        order_index: orderIndex,
      });

    if (linkError) {
      console.error('Entry media link error:', linkError);
      // Clean up media asset and file
      await supabase.from('media_assets').delete().eq('id', mediaAsset.id);
      await supabase.storage.from('media-uploads').remove([filePath]);
      return new Response(
        JSON.stringify({ error: `Failed to link image to entry: ${linkError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image import complete:', { mediaId: mediaAsset.id, entryId });

    return new Response(
      JSON.stringify({
        mediaId: mediaAsset.id,
        url: publicUrl,
        entryId,
        message: 'Image imported successfully',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

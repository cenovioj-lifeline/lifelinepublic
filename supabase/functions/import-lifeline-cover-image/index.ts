import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ImportLifelineCoverRequest {
  lifelineId: string;
  imageUrl: string;
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

    const body: ImportLifelineCoverRequest = await req.json();
    const { lifelineId, imageUrl } = body;

    console.log('Import lifeline cover request:', { lifelineId, imageUrl });

    if (!lifelineId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'lifelineId and imageUrl are required' }),
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
    console.log('Lifeline cover image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        url: publicUrl,
        path: filePath
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Import lifeline cover error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

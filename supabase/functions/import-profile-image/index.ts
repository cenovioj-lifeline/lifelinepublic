import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

interface ImportProfileImageRequest {
  profileId: string;
  imageUrl: string;
  altText?: string;
  position?: {
    x?: number;
    y?: number;
    scale?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: ImportProfileImageRequest = await req.json();
    const { profileId, imageUrl, altText, position } = body;

    console.log('Import profile image request:', { profileId, imageUrl });

    // Validate required fields
    if (!profileId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'profileId and imageUrl are required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Fetch the image from the URL
    console.log('Fetching image from URL...');
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // Get the image as a blob
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Generate a unique filename
    const timestamp = Date.now();
    const extension = contentType.split('/')[1] || 'jpg';
    const filename = `profile-${profileId}-${timestamp}.${extension}`;
    const storagePath = filename;

    console.log('Uploading to storage:', storagePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-uploads')
      .upload(storagePath, imageBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-uploads')
      .getPublicUrl(storagePath);

    console.log('Image uploaded successfully:', publicUrl);

    // Create media asset record
    const { data: mediaAsset, error: mediaError } = await supabase
      .from('media_assets')
      .insert({
        url: publicUrl,
        filename: filename,
        type: 'image',
        alt_text: altText || `${profile.name} avatar`,
        position_x: position?.x || 50,
        position_y: position?.y || 50,
        scale: position?.scale || 1.0,
        source_url: imageUrl,
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Media asset creation error:', mediaError);
      // Clean up uploaded file
      await supabase.storage.from('media-uploads').remove([storagePath]);
      throw new Error(`Failed to create media asset: ${mediaError.message}`);
    }

    console.log('Media asset created:', mediaAsset.id);

    // Update profile with new image
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_image_id: mediaAsset.id,
        primary_image_url: publicUrl,
        primary_image_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Clean up media asset and file
      await supabase.from('media_assets').delete().eq('id', mediaAsset.id);
      await supabase.storage.from('media-uploads').remove([storagePath]);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log('Profile updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        mediaId: mediaAsset.id,
        url: publicUrl,
        path: storagePath,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Import profile image error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

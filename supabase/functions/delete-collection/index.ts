import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin or editor role
    const { data: roleData, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    const { data: editorData } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'editor' });

    if (roleError || (!roleData && !editorData)) {
      throw new Error('Insufficient permissions');
    }

    const { collectionId } = await req.json();

    if (!collectionId) {
      throw new Error('Collection ID is required');
    }

    console.log(`Starting deletion of collection: ${collectionId}`);

    // Step 1: Collect storage paths before deletion
    const storagePaths: string[] = [];

    // Get collection hero image path
    const { data: collection } = await supabase
      .from('collections')
      .select('hero_image_path')
      .eq('id', collectionId)
      .single();

    if (collection?.hero_image_path) {
      storagePaths.push(collection.hero_image_path);
    }

    // Get all lifeline IDs for this collection
    const { data: lifelines } = await supabase
      .from('lifelines')
      .select('id, cover_image_path')
      .eq('collection_id', collectionId);

    const lifelineIds = lifelines?.map(l => l.id) || [];
    console.log(`Found ${lifelineIds.length} lifelines to delete`);

    // Add lifeline cover images
    lifelines?.forEach(l => {
      if (l.cover_image_path) {
        storagePaths.push(l.cover_image_path);
      }
    });

    // Get all entry images for entries in these lifelines
    if (lifelineIds.length > 0) {
      const { data: entriesData } = await supabase
        .from('entries')
        .select('id')
        .in('lifeline_id', lifelineIds);

      const entryIdsForImages = entriesData?.map(e => e.id) || [];

      if (entryIdsForImages.length > 0) {
        const { data: entryImages } = await supabase
          .from('entry_images')
          .select('image_path')
          .in('entry_id', entryIdsForImages);

        entryImages?.forEach(img => {
          if (img.image_path) {
            storagePaths.push(img.image_path);
          }
        });
      }
    }

    console.log(`Collected ${storagePaths.length} storage paths for deletion`);

    // Step 2: Update NULL references FIRST (before any deletes!)
    console.log('Updating references to NULL before deletion...');
    
    const deletedCounts = {
      collection_tags: 0,
      collection_featured_items: 0,
      collection_custom_section_items: 0,
      home_page_featured: 0,
      home_page_new_content: 0,
      user_favorites_collection: 0,
      user_favorites_lifeline: 0,
      lifeline_tags: 0,
      profile_lifelines: 0,
      entry_images: 0,
      entry_media: 0,
      entries: 0,
      lifelines: 0,
      collections: 0,
      elections_updated: 0,
      profiles_updated: 0,
    };
    
    // Update mock_elections to NULL first
    const { count: electionsCount, error: e15 } = await supabase
      .from('mock_elections')
      .update({ collection_id: null }, { count: 'exact' })
      .eq('collection_id', collectionId);
    if (e15) {
      console.error('Error updating elections:', e15);
      throw new Error('Failed to update elections references');
    }
    deletedCounts.elections_updated = electionsCount || 0;

    // Update profiles - primary_collection_id
    const { count: profilesCount1, error: e16 } = await supabase
      .from('profiles')
      .update({ primary_collection_id: null }, { count: 'exact' })
      .eq('primary_collection_id', collectionId);
    if (e16) {
      console.error('Error updating profiles (collection):', e16);
      throw new Error('Failed to update profiles collection references');
    }

    // Update profiles - primary_lifeline_id
    let profilesCount2 = 0;
    if (lifelineIds.length > 0) {
      const { count, error: e17 } = await supabase
        .from('profiles')
        .update({ primary_lifeline_id: null }, { count: 'exact' })
        .in('primary_lifeline_id', lifelineIds);
      if (e17) {
        console.error('Error updating profiles (lifeline):', e17);
        throw new Error('Failed to update profiles lifeline references');
      }
      profilesCount2 = count || 0;
    }
    deletedCounts.profiles_updated = (profilesCount1 || 0) + profilesCount2;

    console.log(`Updated ${deletedCounts.elections_updated} elections and ${deletedCounts.profiles_updated} profiles`);

    // Step 3: Delete database records in correct order
    // Delete collection_tags
    const { error: e1 } = await supabase
      .from('collection_tags')
      .delete()
      .eq('collection_id', collectionId);
    if (e1) console.error('Error deleting collection_tags:', e1);

    // Delete collection_featured_items
    const { error: e2 } = await supabase
      .from('collection_featured_items')
      .delete()
      .eq('collection_id', collectionId);
    if (e2) console.error('Error deleting collection_featured_items:', e2);

    // Delete collection_custom_section_items
    const { error: e3 } = await supabase
      .from('collection_custom_section_items')
      .delete()
      .eq('collection_id', collectionId);
    if (e3) console.error('Error deleting collection_custom_section_items:', e3);

    // Delete home_page_featured_items
    const { error: e4 } = await supabase
      .from('home_page_featured_items')
      .delete()
      .eq('item_type', 'collection')
      .eq('item_id', collectionId);
    if (e4) console.error('Error deleting home_page_featured_items:', e4);

    // Delete home_page_new_content_items
    const { error: e5 } = await supabase
      .from('home_page_new_content_items')
      .delete()
      .eq('item_type', 'collection')
      .eq('item_id', collectionId);
    if (e5) console.error('Error deleting home_page_new_content_items:', e5);

    // Delete user_favorites for collection
    const { error: e6 } = await supabase
      .from('user_favorites')
      .delete()
      .eq('item_type', 'collection')
      .eq('item_id', collectionId);
    if (e6) console.error('Error deleting user_favorites (collection):', e6);

    // Delete user_favorites for lifelines
    if (lifelineIds.length > 0) {
      const { error: e7 } = await supabase
        .from('user_favorites')
        .delete()
        .eq('item_type', 'lifeline')
        .in('item_id', lifelineIds);
      if (e7) console.error('Error deleting user_favorites (lifelines):', e7);
    }

    // Delete lifeline_tags
    if (lifelineIds.length > 0) {
      const { error: e8 } = await supabase
        .from('lifeline_tags')
        .delete()
        .in('lifeline_id', lifelineIds);
      if (e8) console.error('Error deleting lifeline_tags:', e8);
    }

    // Delete profile_lifelines
    if (lifelineIds.length > 0) {
      const { error: e9 } = await supabase
        .from('profile_lifelines')
        .delete()
        .in('lifeline_id', lifelineIds);
      if (e9) console.error('Error deleting profile_lifelines:', e9);
    }

    // Get entry IDs first
    let entryIds: string[] = [];
    if (lifelineIds.length > 0) {
      const { data: entries } = await supabase
        .from('entries')
        .select('id')
        .in('lifeline_id', lifelineIds);
      entryIds = entries?.map(e => e.id) || [];
      deletedCounts.entries = entryIds.length;
    }

    // Delete entry_images
    if (entryIds.length > 0) {
      const { count, error: e10 } = await supabase
        .from('entry_images')
        .delete({ count: 'exact' })
        .in('entry_id', entryIds);
      if (e10) console.error('Error deleting entry_images:', e10);
      else deletedCounts.entry_images = count || 0;
    }

    // Delete entry_media
    if (entryIds.length > 0) {
      const { error: e11 } = await supabase
        .from('entry_media')
        .delete()
        .in('entry_id', entryIds);
      if (e11) console.error('Error deleting entry_media:', e11);
    }

    // Delete entries
    if (lifelineIds.length > 0) {
      const { error: e12 } = await supabase
        .from('entries')
        .delete()
        .in('lifeline_id', lifelineIds);
      if (e12) console.error('Error deleting entries:', e12);
    }

    // Delete lifelines
    const { count: lifelinesCount, error: e13 } = await supabase
      .from('lifelines')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (e13) console.error('Error deleting lifelines:', e13);
    else deletedCounts.lifelines = lifelinesCount || 0;

    // Delete collection
    const { error: e14 } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);
    if (e14) {
      console.error('Error deleting collection:', e14);
      throw new Error('Failed to delete collection');
    }
    deletedCounts.collections = 1;

    console.log('Database deletion complete');

    // Step 4: Delete storage files
    const storageFailures: string[] = [];
    let storageFilesDeleted = 0;

    if (storagePaths.length > 0) {
      // Delete in batches of 50
      const batchSize = 50;
      for (let i = 0; i < storagePaths.length; i += batchSize) {
        const batch = storagePaths.slice(i, i + batchSize);
        const { data, error } = await supabase.storage
          .from('media-uploads')
          .remove(batch);
        
        if (error) {
          console.error('Storage deletion error:', error);
          storageFailures.push(...batch);
        } else {
          storageFilesDeleted += batch.length;
        }
      }
    }

    console.log(`Deleted ${storageFilesDeleted} storage files, ${storageFailures.length} failures`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCounts,
        storageFilesDeleted,
        storageFailures,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

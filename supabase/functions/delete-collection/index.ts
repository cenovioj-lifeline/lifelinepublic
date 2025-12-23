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

    // Get all entry IDs and images for entries in these lifelines
    let entryIds: string[] = [];
    if (lifelineIds.length > 0) {
      const { data: entriesData } = await supabase
        .from('entries')
        .select('id')
        .in('lifeline_id', lifelineIds);

      entryIds = entriesData?.map(e => e.id) || [];

      if (entryIds.length > 0) {
        const { data: entryImages } = await supabase
          .from('entry_images')
          .select('image_path')
          .in('entry_id', entryIds);

        entryImages?.forEach(img => {
          if (img.image_path) {
            storagePaths.push(img.image_path);
          }
        });
      }
    }

    console.log(`Collected ${storagePaths.length} storage paths for deletion`);
    console.log(`Found ${entryIds.length} entries to delete`);

    // Step 2: Update NULL references FIRST (before any deletes!)
    console.log('Updating references to NULL before deletion...');
    
    const deletedCounts = {
      collection_tags: 0,
      collection_featured_items: 0,
      collection_custom_section_items: 0,
      collection_quotes: 0,
      collection_members: 0,
      profile_collections: 0,
      home_page_featured: 0,
      home_page_new_content: 0,
      user_favorites_collection: 0,
      user_favorites_lifeline: 0,
      lifeline_tags: 0,
      profile_lifelines: 0,
      user_feed_subscriptions: 0,
      fan_contributions: 0,
      entry_votes: 0,
      entity_appearances: 0,
      entry_images: 0,
      entry_media: 0,
      entries: 0,
      lifelines: 0,
      collections: 0,
      elections_updated: 0,
      profiles_updated: 0,
    };
    
    // Update mock_elections to NULL first
    const { count: electionsCount, error: electionsError } = await supabase
      .from('mock_elections')
      .update({ collection_id: null }, { count: 'exact' })
      .eq('collection_id', collectionId);
    if (electionsError) {
      console.error('Error updating elections:', electionsError);
      throw new Error('Failed to update elections references');
    }
    deletedCounts.elections_updated = electionsCount || 0;

    // Update profiles - primary_collection_id
    const { count: profilesCount1, error: profilesError1 } = await supabase
      .from('profiles')
      .update({ primary_collection_id: null }, { count: 'exact' })
      .eq('primary_collection_id', collectionId);
    if (profilesError1) {
      console.error('Error updating profiles (collection):', profilesError1);
      throw new Error('Failed to update profiles collection references');
    }

    // Update profiles - primary_lifeline_id
    let profilesCount2 = 0;
    if (lifelineIds.length > 0) {
      const { count, error: profilesError2 } = await supabase
        .from('profiles')
        .update({ primary_lifeline_id: null }, { count: 'exact' })
        .in('primary_lifeline_id', lifelineIds);
      if (profilesError2) {
        console.error('Error updating profiles (lifeline):', profilesError2);
        throw new Error('Failed to update profiles lifeline references');
      }
      profilesCount2 = count || 0;
    }
    deletedCounts.profiles_updated = (profilesCount1 || 0) + profilesCount2;

    console.log(`Updated ${deletedCounts.elections_updated} elections and ${deletedCounts.profiles_updated} profiles`);

    // Step 3: Delete database records in correct order
    
    // Delete collection_tags
    const { count: tagsCount, error: tagsError } = await supabase
      .from('collection_tags')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (tagsError) console.error('Error deleting collection_tags:', tagsError);
    else deletedCounts.collection_tags = tagsCount || 0;

    // Delete collection_featured_items
    const { count: featuredCount, error: featuredError } = await supabase
      .from('collection_featured_items')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (featuredError) console.error('Error deleting collection_featured_items:', featuredError);
    else deletedCounts.collection_featured_items = featuredCount || 0;

    // Delete collection_custom_section_items
    const { count: customCount, error: customError } = await supabase
      .from('collection_custom_section_items')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (customError) console.error('Error deleting collection_custom_section_items:', customError);
    else deletedCounts.collection_custom_section_items = customCount || 0;

    // Delete collection_quotes
    const { count: quotesCount, error: quotesError } = await supabase
      .from('collection_quotes')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (quotesError) console.error('Error deleting collection_quotes:', quotesError);
    else deletedCounts.collection_quotes = quotesCount || 0;

    // Delete collection_members
    const { count: membersCount, error: membersError } = await supabase
      .from('collection_members')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (membersError) console.error('Error deleting collection_members:', membersError);
    else deletedCounts.collection_members = membersCount || 0;

    // Delete profile_collections
    const { count: pcCount, error: pcError } = await supabase
      .from('profile_collections')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (pcError) console.error('Error deleting profile_collections:', pcError);
    else deletedCounts.profile_collections = pcCount || 0;

    // Delete home_page_featured_items
    const { count: hpfCount, error: hpfError } = await supabase
      .from('home_page_featured_items')
      .delete({ count: 'exact' })
      .eq('item_type', 'collection')
      .eq('item_id', collectionId);
    if (hpfError) console.error('Error deleting home_page_featured_items:', hpfError);
    else deletedCounts.home_page_featured = hpfCount || 0;

    // Delete home_page_new_content_items
    const { count: hpncCount, error: hpncError } = await supabase
      .from('home_page_new_content_items')
      .delete({ count: 'exact' })
      .eq('item_type', 'collection')
      .eq('item_id', collectionId);
    if (hpncError) console.error('Error deleting home_page_new_content_items:', hpncError);
    else deletedCounts.home_page_new_content = hpncCount || 0;

    // Delete user_favorites for collection
    const { count: ufcCount, error: ufcError } = await supabase
      .from('user_favorites')
      .delete({ count: 'exact' })
      .eq('item_type', 'collection')
      .eq('item_id', collectionId);
    if (ufcError) console.error('Error deleting user_favorites (collection):', ufcError);
    else deletedCounts.user_favorites_collection = ufcCount || 0;

    // Delete user_favorites for lifelines
    if (lifelineIds.length > 0) {
      const { count: uflCount, error: uflError } = await supabase
        .from('user_favorites')
        .delete({ count: 'exact' })
        .eq('item_type', 'lifeline')
        .in('item_id', lifelineIds);
      if (uflError) console.error('Error deleting user_favorites (lifelines):', uflError);
      else deletedCounts.user_favorites_lifeline = uflCount || 0;
    }

    // Delete lifeline_tags
    if (lifelineIds.length > 0) {
      const { count: ltCount, error: ltError } = await supabase
        .from('lifeline_tags')
        .delete({ count: 'exact' })
        .in('lifeline_id', lifelineIds);
      if (ltError) console.error('Error deleting lifeline_tags:', ltError);
      else deletedCounts.lifeline_tags = ltCount || 0;
    }

    // Delete profile_lifelines
    if (lifelineIds.length > 0) {
      const { count: plCount, error: plError } = await supabase
        .from('profile_lifelines')
        .delete({ count: 'exact' })
        .in('lifeline_id', lifelineIds);
      if (plError) console.error('Error deleting profile_lifelines:', plError);
      else deletedCounts.profile_lifelines = plCount || 0;
    }

    // Delete user_feed_subscriptions for lifelines
    if (lifelineIds.length > 0) {
      const { count: ufsCount, error: ufsError } = await supabase
        .from('user_feed_subscriptions')
        .delete({ count: 'exact' })
        .in('lifeline_id', lifelineIds);
      if (ufsError) console.error('Error deleting user_feed_subscriptions:', ufsError);
      else deletedCounts.user_feed_subscriptions = ufsCount || 0;
    }

    // Delete fan_contributions for lifelines
    if (lifelineIds.length > 0) {
      const { count: fcCount, error: fcError } = await supabase
        .from('fan_contributions')
        .delete({ count: 'exact' })
        .in('lifeline_id', lifelineIds);
      if (fcError) console.error('Error deleting fan_contributions:', fcError);
      else deletedCounts.fan_contributions = fcCount || 0;
    }

    // Delete entry_votes for entries
    if (entryIds.length > 0) {
      const { count: evCount, error: evError } = await supabase
        .from('entry_votes')
        .delete({ count: 'exact' })
        .in('entry_id', entryIds);
      if (evError) console.error('Error deleting entry_votes:', evError);
      else deletedCounts.entry_votes = evCount || 0;
    }

    // Delete entity_appearances for collection
    const { count: eaCollCount, error: eaCollError } = await supabase
      .from('entity_appearances')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (eaCollError) console.error('Error deleting entity_appearances (collection):', eaCollError);
    else deletedCounts.entity_appearances = eaCollCount || 0;

    // Delete entity_appearances for lifelines
    if (lifelineIds.length > 0) {
      const { count: eaLlCount, error: eaLlError } = await supabase
        .from('entity_appearances')
        .delete({ count: 'exact' })
        .in('lifeline_id', lifelineIds);
      if (eaLlError) console.error('Error deleting entity_appearances (lifelines):', eaLlError);
      else deletedCounts.entity_appearances += eaLlCount || 0;
    }

    // Delete entity_appearances for entries
    if (entryIds.length > 0) {
      const { count: eaEntCount, error: eaEntError } = await supabase
        .from('entity_appearances')
        .delete({ count: 'exact' })
        .in('entry_id', entryIds);
      if (eaEntError) console.error('Error deleting entity_appearances (entries):', eaEntError);
      else deletedCounts.entity_appearances += eaEntCount || 0;
    }

    // Delete entry_images
    if (entryIds.length > 0) {
      const { count: eiCount, error: eiError } = await supabase
        .from('entry_images')
        .delete({ count: 'exact' })
        .in('entry_id', entryIds);
      if (eiError) console.error('Error deleting entry_images:', eiError);
      else deletedCounts.entry_images = eiCount || 0;
    }

    // Delete entry_media
    if (entryIds.length > 0) {
      const { count: emCount, error: emError } = await supabase
        .from('entry_media')
        .delete({ count: 'exact' })
        .in('entry_id', entryIds);
      if (emError) console.error('Error deleting entry_media:', emError);
      else deletedCounts.entry_media = emCount || 0;
    }

    // Delete entries
    if (lifelineIds.length > 0) {
      const { count: entriesCount, error: entriesError } = await supabase
        .from('entries')
        .delete({ count: 'exact' })
        .in('lifeline_id', lifelineIds);
      if (entriesError) console.error('Error deleting entries:', entriesError);
      else deletedCounts.entries = entriesCount || 0;
    }

    // Delete lifelines
    const { count: lifelinesCount, error: lifelinesError } = await supabase
      .from('lifelines')
      .delete({ count: 'exact' })
      .eq('collection_id', collectionId);
    if (lifelinesError) console.error('Error deleting lifelines:', lifelinesError);
    else deletedCounts.lifelines = lifelinesCount || 0;

    // Delete collection
    const { error: collectionError } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);
    if (collectionError) {
      console.error('Error deleting collection:', collectionError);
      throw new Error('Failed to delete collection');
    }
    deletedCounts.collections = 1;

    console.log('Database deletion complete');
    console.log('Deleted counts:', JSON.stringify(deletedCounts));

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

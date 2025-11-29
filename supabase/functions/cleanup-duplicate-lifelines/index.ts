import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LifelineWithData {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  cover_image_url: string | null;
  cover_image_path: string | null;
  entry_count: number;
  profile_links: Array<{
    id: string;
    profile_id: string;
    relationship_type: string;
  }>;
  has_subject_link: boolean;
  score: number;
}

interface DuplicateGroup {
  title: string;
  lifelines: LifelineWithData[];
  safe_to_delete: boolean;
  warning_reason?: string;
  keep_lifeline_id?: string;
  delete_lifeline_ids?: string[];
  entries_to_save?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { collection_id, mode } = await req.json();

    if (!collection_id) {
      throw new Error('collection_id is required');
    }

    if (mode !== 'analyze' && mode !== 'execute') {
      throw new Error('mode must be "analyze" or "execute"');
    }

    console.log(`Starting duplicate cleanup in ${mode} mode for collection ${collection_id}`);

    // Fetch all lifelines in this collection with their related data
    const { data: lifelines, error: lifelinesError } = await supabase
      .from('lifelines')
      .select(`
        id,
        title,
        slug,
        created_at,
        cover_image_url,
        cover_image_path,
        profile_lifelines (
          id,
          profile_id,
          relationship_type
        )
      `)
      .eq('collection_id', collection_id)
      .order('title');

    if (lifelinesError) throw lifelinesError;

    // Get entry counts for each lifeline
    const lifelineIds = lifelines.map((l: any) => l.id);
    const { data: entryCounts, error: entryError } = await supabase
      .from('entries')
      .select('lifeline_id')
      .in('lifeline_id', lifelineIds);

    if (entryError) throw entryError;

    const entryCountMap: Record<string, number> = {};
    entryCounts.forEach((entry: any) => {
      entryCountMap[entry.lifeline_id] = (entryCountMap[entry.lifeline_id] || 0) + 1;
    });

    // Group lifelines by title and score them
    const titleGroups: Record<string, LifelineWithData[]> = {};
    
    lifelines.forEach((lifeline: any) => {
      const entryCount = entryCountMap[lifeline.id] || 0;
      const hasSubjectLink = lifeline.profile_lifelines?.some(
        (pl: any) => pl.relationship_type === 'subject'
      ) || false;

      // Calculate score
      let score = 0;
      if (hasSubjectLink) score += 1000;
      score += entryCount * 10;
      if (lifeline.cover_image_url) score += 100;
      score += (Date.now() - new Date(lifeline.created_at).getTime()) / 1000000000;

      const lifelineWithData: LifelineWithData = {
        id: lifeline.id,
        title: lifeline.title,
        slug: lifeline.slug,
        created_at: lifeline.created_at,
        cover_image_url: lifeline.cover_image_url,
        cover_image_path: lifeline.cover_image_path,
        entry_count: entryCount,
        profile_links: lifeline.profile_lifelines || [],
        has_subject_link: hasSubjectLink,
        score,
      };

      if (!titleGroups[lifeline.title]) {
        titleGroups[lifeline.title] = [];
      }
      titleGroups[lifeline.title].push(lifelineWithData);
    });

    // Identify duplicates and determine safety
    const duplicateGroups: DuplicateGroup[] = [];
    
    Object.entries(titleGroups).forEach(([title, lifelines]) => {
      if (lifelines.length < 2) return;

      // Sort by score (highest first)
      const sorted = lifelines.sort((a, b) => b.score - a.score);
      const keep = sorted[0];
      const duplicates = sorted.slice(1);

      let safeToDelete = true;
      let warningReason = '';

      // Safety check 1: More than 2 duplicates
      if (lifelines.length > 2) {
        safeToDelete = false;
        warningReason = `Found ${lifelines.length} duplicates. Manual review required.`;
      }
      // Safety check 2: Multiple subject links
      else if (sorted.filter(l => l.has_subject_link).length > 1) {
        safeToDelete = false;
        warningReason = 'Multiple lifelines marked as profile\'s main lifeline. Manual review required.';
      }
      // Safety check 3: Both have significant data
      else if (sorted.length === 2 && sorted[0].entry_count > 5 && sorted[1].entry_count > 5) {
        safeToDelete = false;
        warningReason = `Both duplicates have significant content (${sorted[0].entry_count} and ${sorted[1].entry_count} entries). Manual review required.`;
      }

      duplicateGroups.push({
        title,
        lifelines: sorted,
        safe_to_delete: safeToDelete,
        warning_reason: warningReason,
        keep_lifeline_id: keep.id,
        delete_lifeline_ids: duplicates.map(d => d.id),
        entries_to_save: duplicates.reduce((sum, d) => sum + d.entry_count, 0),
      });
    });

    // If analyze mode, return results
    if (mode === 'analyze') {
      return new Response(
        JSON.stringify({
          success: true,
          duplicate_groups: duplicateGroups,
          total_duplicates: duplicateGroups.length,
          safe_to_delete: duplicateGroups.filter(g => g.safe_to_delete).length,
          requires_review: duplicateGroups.filter(g => !g.safe_to_delete).length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute mode: Delete safe duplicates
    const safeGroups = duplicateGroups.filter(g => g.safe_to_delete);
    let deletedCount = 0;
    const deletionResults = [];

    for (const group of safeGroups) {
      for (const deleteId of group.delete_lifeline_ids!) {
        try {
          console.log(`Deleting duplicate lifeline: ${deleteId} (${group.title})`);

          // 1. Transfer any 'appears_in' links to 'subject' on kept lifeline if needed
          const duplicateToDelete = group.lifelines.find(l => l.id === deleteId);
          if (duplicateToDelete?.profile_links) {
            for (const link of duplicateToDelete.profile_links) {
              if (link.relationship_type === 'appears_in') {
                // Check if kept lifeline already has this profile link
                const { data: existingLink } = await supabase
                  .from('profile_lifelines')
                  .select('id')
                  .eq('profile_id', link.profile_id)
                  .eq('lifeline_id', group.keep_lifeline_id!)
                  .single();

                if (!existingLink) {
                  // Add subject link to kept lifeline
                  await supabase.from('profile_lifelines').insert({
                    profile_id: link.profile_id,
                    lifeline_id: group.keep_lifeline_id!,
                    relationship_type: 'subject',
                  });
                }
              }
            }
          }

          // 2. Delete profile_lifelines
          await supabase.from('profile_lifelines').delete().eq('lifeline_id', deleteId);

          // 3. Delete lifeline_tags
          await supabase.from('lifeline_tags').delete().eq('lifeline_id', deleteId);

          // 4. Delete entity_appearances
          await supabase.from('entity_appearances').delete().eq('lifeline_id', deleteId);

          // 5. Get all entry IDs for this lifeline
          const { data: entries } = await supabase
            .from('entries')
            .select('id')
            .eq('lifeline_id', deleteId);

          const entryIds = entries?.map((e: any) => e.id) || [];

          if (entryIds.length > 0) {
            // 6. Delete entry_media
            await supabase.from('entry_media').delete().in('entry_id', entryIds);

            // 7. Delete entry_images
            await supabase.from('entry_images').delete().in('entry_id', entryIds);

            // 8. Delete entry_votes
            await supabase.from('entry_votes').delete().in('entry_id', entryIds);

            // 9. Delete entries
            await supabase.from('entries').delete().in('id', entryIds);
          }

          // 10. Delete fan_contributions
          await supabase.from('fan_contributions').delete().eq('lifeline_id', deleteId);

          // 11. Delete the lifeline itself
          await supabase.from('lifelines').delete().eq('id', deleteId);

          // 12. Delete cover image from storage if exists
          if (duplicateToDelete?.cover_image_path) {
            await supabase.storage.from('media-uploads').remove([duplicateToDelete.cover_image_path]);
          }

          deletedCount++;
          deletionResults.push({
            title: group.title,
            deleted_id: deleteId,
            entries_removed: entryIds.length,
            success: true,
          });

          console.log(`Successfully deleted lifeline ${deleteId}`);
        } catch (error: any) {
          console.error(`Error deleting lifeline ${deleteId}:`, error);
          deletionResults.push({
            title: group.title,
            deleted_id: deleteId,
            success: false,
            error: error.message,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount,
        deletion_results: deletionResults,
        safe_groups_processed: safeGroups.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in cleanup-duplicate-lifelines:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Cleanup orphan profiles function started')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isAdmin = roles?.some(r => r.role === 'admin')
    if (!isAdmin) {
      throw new Error('Admin access required')
    }

    // Parse request body for dry_run option
    let dryRun = true
    try {
      const body = await req.json()
      dryRun = body.dry_run !== false // Default to dry run unless explicitly set to false
    } catch {
      // No body or invalid JSON, default to dry run
    }

    console.log(`Running cleanup in ${dryRun ? 'DRY RUN' : 'LIVE'} mode`)

    // Find all orphaned profiles (no primary_collection_id AND no profile_collections entries)
    const { data: orphanedProfiles, error: orphanError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        slug,
        primary_image_path
      `)
      .is('primary_collection_id', null)

    if (orphanError) {
      throw new Error(`Failed to fetch profiles: ${orphanError.message}`)
    }

    // Filter to only those without profile_collections entries
    const { data: profileCollections } = await supabase
      .from('profile_collections')
      .select('profile_id')

    const linkedProfileIds = new Set(profileCollections?.map(pc => pc.profile_id) || [])
    const trulyOrphaned = orphanedProfiles?.filter(p => !linkedProfileIds.has(p.id)) || []

    console.log(`Found ${trulyOrphaned.length} orphaned profiles`)

    if (dryRun) {
      // Return what would be deleted without actually deleting
      return new Response(
        JSON.stringify({
          dry_run: true,
          orphaned_count: trulyOrphaned.length,
          profiles: trulyOrphaned.map(p => ({ id: p.id, name: p.name, slug: p.slug })),
          message: 'This is a dry run. Set dry_run: false to actually delete these profiles.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Track deletion statistics
    const stats = {
      profiles_deleted: 0,
      profile_works: 0,
      profile_relationships: 0,
      profile_tags: 0,
      profile_lifelines: 0,
      entity_appearances: 0,
      lifelines_updated: 0,
      ballot_options_updated: 0,
      election_results_updated: 0,
      storage_files: 0,
      errors: [] as string[],
    }

    // Process each orphaned profile
    for (const profile of trulyOrphaned) {
      try {
        console.log(`Processing profile: ${profile.name} (${profile.id})`)

        // Collect storage paths for cleanup
        const storagePaths: string[] = []
        if (profile.primary_image_path) {
          storagePaths.push(profile.primary_image_path)
        }

        // 1. Update lifelines.profile_id to NULL
        const { data: updatedLifelines } = await supabase
          .from('lifelines')
          .update({ profile_id: null })
          .eq('profile_id', profile.id)
          .select()
        stats.lifelines_updated += updatedLifelines?.length || 0

        // 2. Remove profile from election_results.winner_profile_ids arrays
        const { data: electionResults } = await supabase
          .from('election_results')
          .select('id, winner_profile_ids')
          .contains('winner_profile_ids', [profile.id])

        if (electionResults) {
          for (const result of electionResults) {
            const updatedIds = result.winner_profile_ids?.filter((id: string) => id !== profile.id) || []
            await supabase
              .from('election_results')
              .update({ winner_profile_ids: updatedIds })
              .eq('id', result.id)
            stats.election_results_updated++
          }
        }

        // 3. Delete profile_works
        const { data: deletedWorks } = await supabase
          .from('profile_works')
          .delete()
          .eq('profile_id', profile.id)
          .select()
        stats.profile_works += deletedWorks?.length || 0

        // 4. Delete profile_relationships (both sides)
        const { data: deletedRels1 } = await supabase
          .from('profile_relationships')
          .delete()
          .eq('profile_id', profile.id)
          .select()
        
        const { data: deletedRels2 } = await supabase
          .from('profile_relationships')
          .delete()
          .eq('related_profile_id', profile.id)
          .select()
        
        stats.profile_relationships += (deletedRels1?.length || 0) + (deletedRels2?.length || 0)

        // 5. Delete profile_tags
        const { data: deletedTags } = await supabase
          .from('profile_tags')
          .delete()
          .eq('profile_id', profile.id)
          .select()
        stats.profile_tags += deletedTags?.length || 0

        // 6. Delete profile_lifelines
        const { data: deletedProfileLifelines } = await supabase
          .from('profile_lifelines')
          .delete()
          .eq('profile_id', profile.id)
          .select()
        stats.profile_lifelines += deletedProfileLifelines?.length || 0

        // 7. Delete entity_appearances
        const { data: deletedAppearances } = await supabase
          .from('entity_appearances')
          .delete()
          .eq('profile_id', profile.id)
          .select()
        stats.entity_appearances += deletedAppearances?.length || 0

        // 8. Set ballot_options.profile_ref to NULL
        const { data: updatedBallotOptions } = await supabase
          .from('ballot_options')
          .update({ profile_ref: null })
          .eq('profile_ref', profile.id)
          .select()
        stats.ballot_options_updated += updatedBallotOptions?.length || 0

        // 9. Set election_results.winner_profile_id to NULL
        await supabase
          .from('election_results')
          .update({ winner_profile_id: null })
          .eq('winner_profile_id', profile.id)

        // 10. Delete the profile itself
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id)

        if (profileError) {
          stats.errors.push(`Failed to delete profile ${profile.name}: ${profileError.message}`)
          continue
        }

        stats.profiles_deleted++

        // 11. Delete storage files
        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('media-uploads')
            .remove(storagePaths)
          
          if (!storageError) {
            stats.storage_files += storagePaths.length
          }
        }

      } catch (profileError) {
        const errorMsg = profileError instanceof Error ? profileError.message : 'Unknown error'
        stats.errors.push(`Error processing profile ${profile.name}: ${errorMsg}`)
        console.error(`Error processing profile ${profile.name}:`, profileError)
      }
    }

    console.log('Orphan cleanup completed:', stats)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        dry_run: false,
        stats,
        message: `Deleted ${stats.profiles_deleted} orphaned profiles`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in cleanup-orphan-profiles function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

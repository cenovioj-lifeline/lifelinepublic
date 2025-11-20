import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Delete profile function started')

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

    // Check if user has admin or editor role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'editor')
    if (!hasPermission) {
      throw new Error('Insufficient permissions')
    }

    // Get profileId from request
    const { profileId } = await req.json()
    console.log('Deleting profile:', profileId)

    if (!profileId) {
      throw new Error('Profile ID is required')
    }

    // Get profile data for storage cleanup
    const { data: profile } = await supabase
      .from('profiles')
      .select('primary_image_path, avatar_image_id')
      .eq('id', profileId)
      .single()

    const storagePaths: string[] = []
    if (profile?.primary_image_path) {
      storagePaths.push(profile.primary_image_path)
    }

    // Track deletion statistics
    const stats = {
      profile_works: 0,
      profile_relationships: 0,
      profile_tags: 0,
      profile_collections: 0,
      profile_lifelines: 0,
      entity_appearances: 0,
      lifelines_updated: 0,
      ballot_options_updated: 0,
      election_results_updated: 0,
      storage_files: 0,
    }

    // 1. Update lifelines.profile_id to NULL
    const { data: updatedLifelines } = await supabase
      .from('lifelines')
      .update({ profile_id: null })
      .eq('profile_id', profileId)
      .select()
    stats.lifelines_updated = updatedLifelines?.length || 0
    console.log('Updated lifelines:', stats.lifelines_updated)

    // 2. Remove profile from election_results.winner_profile_ids arrays
    const { data: electionResults } = await supabase
      .from('election_results')
      .select('id, winner_profile_ids')
      .contains('winner_profile_ids', [profileId])

    if (electionResults) {
      for (const result of electionResults) {
        const updatedIds = result.winner_profile_ids?.filter((id: string) => id !== profileId) || []
        await supabase
          .from('election_results')
          .update({ winner_profile_ids: updatedIds })
          .eq('id', result.id)
        stats.election_results_updated++
      }
    }
    console.log('Updated election results:', stats.election_results_updated)

    // 3. Delete profile_works
    const { data: deletedWorks } = await supabase
      .from('profile_works')
      .delete()
      .eq('profile_id', profileId)
      .select()
    stats.profile_works = deletedWorks?.length || 0
    console.log('Deleted profile works:', stats.profile_works)

    // 4. Delete profile_relationships (both sides)
    const { data: deletedRels1 } = await supabase
      .from('profile_relationships')
      .delete()
      .eq('profile_id', profileId)
      .select()
    
    const { data: deletedRels2 } = await supabase
      .from('profile_relationships')
      .delete()
      .eq('related_profile_id', profileId)
      .select()
    
    stats.profile_relationships = (deletedRels1?.length || 0) + (deletedRels2?.length || 0)
    console.log('Deleted profile relationships:', stats.profile_relationships)

    // 5. Delete profile_tags
    const { data: deletedTags } = await supabase
      .from('profile_tags')
      .delete()
      .eq('profile_id', profileId)
      .select()
    stats.profile_tags = deletedTags?.length || 0
    console.log('Deleted profile tags:', stats.profile_tags)

    // 6. Delete profile_collections
    const { data: deletedCollections } = await supabase
      .from('profile_collections')
      .delete()
      .eq('profile_id', profileId)
      .select()
    stats.profile_collections = deletedCollections?.length || 0
    console.log('Deleted profile collections:', stats.profile_collections)

    // 7. Delete profile_lifelines
    const { data: deletedProfileLifelines } = await supabase
      .from('profile_lifelines')
      .delete()
      .eq('profile_id', profileId)
      .select()
    stats.profile_lifelines = deletedProfileLifelines?.length || 0
    console.log('Deleted profile lifelines:', stats.profile_lifelines)

    // 8. Delete entity_appearances
    const { data: deletedAppearances } = await supabase
      .from('entity_appearances')
      .delete()
      .eq('profile_id', profileId)
      .select()
    stats.entity_appearances = deletedAppearances?.length || 0
    console.log('Deleted entity appearances:', stats.entity_appearances)

    // 9. Set ballot_options.profile_ref to NULL
    const { data: updatedBallotOptions } = await supabase
      .from('ballot_options')
      .update({ profile_ref: null })
      .eq('profile_ref', profileId)
      .select()
    stats.ballot_options_updated = updatedBallotOptions?.length || 0
    console.log('Updated ballot options:', stats.ballot_options_updated)

    // 10. Set election_results.winner_profile_id to NULL
    await supabase
      .from('election_results')
      .update({ winner_profile_id: null })
      .eq('winner_profile_id', profileId)

    // 11. Delete the profile itself
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (profileError) {
      throw new Error(`Failed to delete profile: ${profileError.message}`)
    }
    console.log('Deleted profile')

    // 12. Delete storage files
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('media-uploads')
        .remove(storagePaths)
      
      if (storageError) {
        console.error('Storage deletion error:', storageError)
      } else {
        stats.storage_files = storagePaths.length
        console.log('Deleted storage files:', stats.storage_files)
      }
    }

    console.log('Profile deletion completed successfully')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        stats,
        message: 'Profile deleted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in delete-profile function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the profile'
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

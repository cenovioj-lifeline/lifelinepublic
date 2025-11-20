import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Delete election function invoked")

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin or editor role
    const { data: roleData } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })
    
    const { data: editorRoleData } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'editor'
    })

    if (!roleData && !editorRoleData) {
      throw new Error('User does not have permission to delete elections')
    }

    const { electionId } = await req.json()

    if (!electionId) {
      throw new Error('Election ID is required')
    }

    console.log(`Starting deletion process for election: ${electionId}`)

    // Step 1: Collect all storage paths that need to be deleted
    const storagePaths: string[] = []

    // Get hero image path from election
    const { data: election } = await supabaseAdmin
      .from('mock_elections')
      .select('hero_image_path')
      .eq('id', electionId)
      .single()

    if (election?.hero_image_path) {
      storagePaths.push(election.hero_image_path)
    }

    console.log(`Collected ${storagePaths.length} storage paths`)

    // Step 2: Delete ballot_options first (they reference ballot_items)
    const { data: ballotItems } = await supabaseAdmin
      .from('ballot_items')
      .select('id')
      .eq('election_id', electionId)

    const ballotItemIds = ballotItems?.map(item => item.id) || []

    let deletedBallotOptions = 0
    if (ballotItemIds.length > 0) {
      const { error: ballotOptionsError, count } = await supabaseAdmin
        .from('ballot_options')
        .delete({ count: 'exact' })
        .in('ballot_item_id', ballotItemIds)

      if (ballotOptionsError) {
        console.error('Error deleting ballot_options:', ballotOptionsError)
      } else {
        deletedBallotOptions = count || 0
        console.log(`Deleted ${deletedBallotOptions} ballot options`)
      }
    }

    // Step 3: Delete ballot_items
    const { error: ballotItemsError, count: ballotItemsCount } = await supabaseAdmin
      .from('ballot_items')
      .delete({ count: 'exact' })
      .eq('election_id', electionId)

    if (ballotItemsError) {
      console.error('Error deleting ballot_items:', ballotItemsError)
    }
    const deletedBallotItems = ballotItemsCount || 0
    console.log(`Deleted ${deletedBallotItems} ballot items`)

    // Step 4: Delete election_results
    const { error: resultsError, count: resultsCount } = await supabaseAdmin
      .from('election_results')
      .delete({ count: 'exact' })
      .eq('election_id', electionId)

    if (resultsError) {
      console.error('Error deleting election_results:', resultsError)
    }
    const deletedResults = resultsCount || 0
    console.log(`Deleted ${deletedResults} election results`)

    // Step 5: Delete election_tags
    const { error: tagsError, count: tagsCount } = await supabaseAdmin
      .from('election_tags')
      .delete({ count: 'exact' })
      .eq('election_id', electionId)

    if (tagsError) {
      console.error('Error deleting election_tags:', tagsError)
    }
    const deletedTags = tagsCount || 0
    console.log(`Deleted ${deletedTags} election tags`)

    // Step 6: Delete from user_favorites
    const { error: favoritesError, count: favoritesCount } = await supabaseAdmin
      .from('user_favorites')
      .delete({ count: 'exact' })
      .eq('item_id', electionId)
      .eq('item_type', 'election')

    if (favoritesError) {
      console.error('Error deleting user_favorites:', favoritesError)
    }
    const deletedFavorites = favoritesCount || 0
    console.log(`Deleted ${deletedFavorites} favorites`)

    // Step 7: Delete from home_page_featured_items
    const { error: featuredError, count: featuredCount } = await supabaseAdmin
      .from('home_page_featured_items')
      .delete({ count: 'exact' })
      .eq('item_id', electionId)
      .eq('item_type', 'election')

    if (featuredError) {
      console.error('Error deleting home_page_featured_items:', featuredError)
    }
    const deletedFeatured = featuredCount || 0
    console.log(`Deleted ${deletedFeatured} featured items`)

    // Step 8: Delete the election itself
    const { error: electionError } = await supabaseAdmin
      .from('mock_elections')
      .delete()
      .eq('id', electionId)

    if (electionError) {
      throw electionError
    }

    console.log('Election record deleted')

    // Step 9: Delete storage files
    const storageFailures: string[] = []
    if (storagePaths.length > 0) {
      const { data: deleteData, error: storageError } = await supabaseAdmin
        .storage
        .from('media-uploads')
        .remove(storagePaths)

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        storageFailures.push(...storagePaths)
      } else {
        console.log(`Deleted ${deleteData?.length || 0} storage files`)
      }
    }

    const deletedCounts = {
      ballotItems: deletedBallotItems,
      ballotOptions: deletedBallotOptions,
      results: deletedResults,
      tags: deletedTags,
      favorites: deletedFavorites,
      featured: deletedFeatured,
      storageFiles: storagePaths.length - storageFailures.length
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCounts,
        storageFailures
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Delete election error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

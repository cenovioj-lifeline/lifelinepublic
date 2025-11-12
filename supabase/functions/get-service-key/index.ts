// ⚠️⚠️⚠️ TEMPORARY FUNCTION - DELETE IMMEDIATELY AFTER USE ⚠️⚠️⚠️
// This function exposes the service role key and should NEVER remain deployed
// Created: 2025-01-12
// Purpose: Retrieve service role key from Lovable secrets
// Action Required: DELETE THIS FILE AND FUNCTION AFTER RETRIEVING THE KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ⚠️ SECURITY WARNING: Exposing service role key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Service role key not found in environment',
          message: 'SUPABASE_SERVICE_ROLE_KEY is not set'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Return the key
    return new Response(
      JSON.stringify({ 
        serviceRoleKey,
        warning: '⚠️ DELETE THIS FUNCTION IMMEDIATELY AFTER RETRIEVING THE KEY',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: 'Failed to retrieve service role key'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

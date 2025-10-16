import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const parseFlexibleDate = (dateStr: any): string | null => {
  if (!dateStr || dateStr === '-') return null;
  
  // Handle Excel numeric dates (days since 1900-01-01)
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Handle string dates
  const cleaned = String(dateStr).trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  if (/^\d{4}-\d{2}$/.test(cleaned)) return `${cleaned}-01`;
  if (/^\d{4}$/.test(cleaned)) return `${cleaned}-01-01`;
  
  return null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lifelines, entries, collectionId } = await req.json();

    if (!collectionId) {
      return new Response(
        JSON.stringify({ error: 'Collection ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify collection exists
    const { data: collection, error: collError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .single();

    if (collError || !collection) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const results = {
      lifelines_created: 0,
      lifelines_skipped: 0,
      entries_created: 0,
      errors: [] as string[],
    };

    const lifelineMap = new Map<string, string>();

    // Process lifelines
    for (const lifelineData of lifelines) {
      try {
        const slug = generateSlug(lifelineData.title);
        
        // Check if exists
        const { data: existing } = await supabase
          .from('lifelines')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          lifelineMap.set(lifelineData.title, existing.id);
          results.lifelines_skipped++;
          continue;
        }

        // Insert lifeline
        const { data: newLifeline, error: lifelineError } = await supabase
          .from('lifelines')
          .insert({
            title: lifelineData.title,
            slug: slug,
            subject: lifelineData.subject,
            lifeline_type: lifelineData.type,
            status: 'published',
            visibility: 'public',
            collection_id: collectionId,
            intro: lifelineData.intro,
          })
          .select('id')
          .single();

        if (lifelineError) {
          results.errors.push(`Lifeline "${lifelineData.title}": ${lifelineError.message}`);
          continue;
        }

        if (newLifeline) {
          lifelineMap.set(lifelineData.title, newLifeline.id);
          results.lifelines_created++;
        }
      } catch (error: any) {
        results.errors.push(`Lifeline "${lifelineData.title}": ${error.message}`);
      }
    }

    // Process entries
    for (const entryData of entries) {
      try {
        const lifelineId = lifelineMap.get(entryData.lifeline_title);
        if (!lifelineId) {
          results.errors.push(`Entry "${entryData.title}": Lifeline not found`);
          continue;
        }

        const occurredOn = parseFlexibleDate(entryData.date);

        const { error: entryError } = await supabase
          .from('entries')
          .insert({
            lifeline_id: lifelineId,
            title: entryData.title,
            details: entryData.details,
            score: entryData.score,
            occurred_on: occurredOn,
            order_index: entryData.order_index || 0,
            collection_id: collectionId,
          });

        if (entryError) {
          results.errors.push(`Entry "${entryData.title}": ${entryError.message}`);
          continue;
        }

        results.entries_created++;
      } catch (error: any) {
        results.errors.push(`Entry "${entryData.title}": ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

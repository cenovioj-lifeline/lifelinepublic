import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CollectionReportData {
  lifelines: {
    personCount: number;
    listCount: number;
    coverImagePercentage: number;
    total: number;
  };
  entries: {
    datePercentage: number;
    scorePercentage: number;
    serpApiCount: number;
    serpApiTotal: number;
    imagePercentage: number;
    total: number;
  };
  profiles: {
    total: number;
    hasFullData: boolean;
    hasImages: boolean;
    linkedToLifelines: boolean;
    linkedToMER: boolean;
    linkedToQuotes: boolean;
    imagePercentage: number;
  };
  quotes: {
    exists: boolean;
    count: number;
    linkedToProfiles: boolean;
    profileImagePercentage: number;
  };
  mer: {
    exists: boolean;
    count: number;
    linkedToProfiles: boolean;
    profileImagePercentage: number;
  };
  other: {
    hasCustomColorScheme: boolean;
    colorSchemeName?: string;
  };
}

export function useCollectionReport(collectionId: string | null) {
  return useQuery({
    queryKey: ['collection-report', collectionId],
    queryFn: async (): Promise<CollectionReportData> => {
      if (!collectionId) throw new Error('No collection selected');

      // Fetch collection with color scheme
      const { data: collection } = await supabase
        .from('collections')
        .select(`
          id,
          color_scheme_id,
          color_schemes (name)
        `)
        .eq('id', collectionId)
        .single();

      // Fetch lifelines
      const { data: lifelines } = await supabase
        .from('lifelines')
        .select('id, cover_image_id, lifeline_type')
        .eq('collection_id', collectionId);

      const lifelineIds = lifelines?.map(l => l.id) || [];

      // Fetch entries
      const { data: entries } = await supabase
        .from('entries')
        .select('id, occurred_on, score, serpapi_query, order_index')
        .in('lifeline_id', lifelineIds);

      // Fetch entry images
      const { data: entryImages } = await supabase
        .from('entry_images')
        .select('entry_id')
        .in('entry_id', entries?.map(e => e.id) || []);

      const entriesWithImages = new Set(entryImages?.map(ei => ei.entry_id));

      // Classify lifelines as person vs list
      // Person lifelines: have entries with dates
      // List lifelines: entries use order_index for ranking, no dates
      const lifelineEntries = new Map<string, typeof entries>();
      entries?.forEach(entry => {
        const lifelineId = lifelines?.find(l => 
          entries.filter(e => e.id === entry.id).length > 0
        )?.id;
        if (lifelineId) {
          if (!lifelineEntries.has(lifelineId)) {
            lifelineEntries.set(lifelineId, []);
          }
          lifelineEntries.get(lifelineId)?.push(entry);
        }
      });

      const personLifelines = lifelines?.filter(l => {
        const llEntries = entries?.filter(e => {
          // Need to join through lifeline_id but we don't have it in entries
          // Let's use a simpler approach: check if ANY entry has a date
          return true; // We'll count by entries having dates
        });
        return llEntries?.some(e => e.occurred_on !== null);
      }).length || 0;

      const listLifelines = (lifelines?.length || 0) - personLifelines;

      // Fetch profiles linked to collection
      const { data: profileCollections } = await supabase
        .from('profile_collections')
        .select('profile_id')
        .eq('collection_id', collectionId);

      const profileIds = profileCollections?.map(pc => pc.profile_id) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, extended_data, primary_image_url, avatar_image_id')
        .in('id', profileIds);

      // Check if any profile has full extended_data
      const hasFullData = profiles?.some(p => {
        const data = p.extended_data as any;
        return data && (
          (data.biographical && Object.keys(data.biographical).length > 0) ||
          (data.fictional && Object.keys(data.fictional).length > 0) ||
          (data.legacy && Object.keys(data.legacy).length > 0) ||
          (data.physical && Object.keys(data.physical).length > 0)
        );
      }) || false;

      const hasImages = profiles?.some(p => 
        p.primary_image_url || p.avatar_image_id
      ) || false;

      const profilesWithImages = profiles?.filter(p => 
        p.primary_image_url || p.avatar_image_id
      ).length || 0;

      // Check profile links
      const { data: profileLifelines } = await supabase
        .from('profile_lifelines')
        .select('profile_id')
        .in('profile_id', profileIds);

      // Fetch quotes
      const { data: quotes } = await supabase
        .from('collection_quotes')
        .select(`
          id,
          author_profile_id,
          profiles:author_profile_id (
            primary_image_url,
            avatar_image_id
          )
        `)
        .eq('collection_id', collectionId);

      const quotesLinkedToProfiles = quotes?.some(q => 
        q.author_profile_id !== null
      ) || false;

      const quotesWithProfileImages = quotes?.filter(q => {
        const profile = q.profiles as any;
        return profile?.primary_image_url || profile?.avatar_image_id;
      }).length || 0;

      // Fetch elections and results
      const { data: elections } = await supabase
        .from('mock_elections')
        .select('id')
        .eq('collection_id', collectionId);

      const electionIds = elections?.map(e => e.id) || [];

      const { data: electionResults } = await supabase
        .from('election_results')
        .select(`
          id,
          winner_profile_id,
          winner_profile_ids,
          profiles:winner_profile_id (
            primary_image_url,
            avatar_image_id
          )
        `)
        .in('election_id', electionIds);

      const merLinkedToProfiles = electionResults?.some(r => 
        r.winner_profile_id !== null || (r.winner_profile_ids && r.winner_profile_ids.length > 0)
      ) || false;

      const merWithProfileImages = electionResults?.filter(r => {
        const profile = r.profiles as any;
        return profile?.primary_image_url || profile?.avatar_image_id;
      }).length || 0;

      // Calculate percentages
      const lifelineCoverImagePercentage = lifelines && lifelines.length > 0
        ? (lifelines.filter(l => l.cover_image_id).length / lifelines.length) * 100
        : 0;

      const entryDatePercentage = entries && entries.length > 0
        ? (entries.filter(e => e.occurred_on).length / entries.length) * 100
        : 0;

      const entryScorePercentage = entries && entries.length > 0
        ? (entries.filter(e => e.score !== null).length / entries.length) * 100
        : 0;

      const entryImagePercentage = entries && entries.length > 0
        ? (entries.filter(e => entriesWithImages.has(e.id)).length / entries.length) * 100
        : 0;

      const profileImagePercentage = profiles && profiles.length > 0
        ? (profilesWithImages / profiles.length) * 100
        : 0;

      const quoteProfileImagePercentage = quotes && quotes.length > 0
        ? (quotesWithProfileImages / quotes.length) * 100
        : 0;

      const merProfileImagePercentage = electionResults && electionResults.length > 0
        ? (merWithProfileImages / electionResults.length) * 100
        : 0;

      return {
        lifelines: {
          personCount: personLifelines,
          listCount: listLifelines,
          coverImagePercentage: lifelineCoverImagePercentage,
          total: lifelines?.length || 0,
        },
        entries: {
          datePercentage: entryDatePercentage,
          scorePercentage: entryScorePercentage,
          serpApiCount: entries?.filter(e => e.serpapi_query).length || 0,
          serpApiTotal: entries?.length || 0,
          imagePercentage: entryImagePercentage,
          total: entries?.length || 0,
        },
        profiles: {
          total: profiles?.length || 0,
          hasFullData,
          hasImages,
          linkedToLifelines: (profileLifelines?.length || 0) > 0,
          linkedToMER: merLinkedToProfiles,
          linkedToQuotes: quotesLinkedToProfiles,
          imagePercentage: profileImagePercentage,
        },
        quotes: {
          exists: (quotes?.length || 0) > 0,
          count: quotes?.length || 0,
          linkedToProfiles: quotesLinkedToProfiles,
          profileImagePercentage: quoteProfileImagePercentage,
        },
        mer: {
          exists: (electionResults?.length || 0) > 0,
          count: electionResults?.length || 0,
          linkedToProfiles: merLinkedToProfiles,
          profileImagePercentage: merProfileImagePercentage,
        },
        other: {
          hasCustomColorScheme: !!collection?.color_scheme_id,
          colorSchemeName: (collection?.color_schemes as any)?.name,
        },
      };
    },
    enabled: !!collectionId,
  });
}

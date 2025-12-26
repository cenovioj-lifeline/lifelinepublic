import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  intro?: string | null;
  hero_image_url?: string | null;
  cover_image_url?: string | null;
  card_image_url?: string | null;
  hero_image?: { url: string; alt_text: string | null } | null;
  cover_image?: { url: string; alt_text: string | null } | null;
  cover_image_position_x?: number | null;
  cover_image_position_y?: number | null;
  hero_image_position_x?: number | null;
  hero_image_position_y?: number | null;
  type: "collection" | "lifeline" | "election";
}

interface HomePageSettings {
  id: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_position_x: number | null;
  hero_image_position_y: number | null;
  hero_image: { url: string; alt_text: string | null } | null;
  custom_section_name: string | null;
}

interface HomePageData {
  settings: HomePageSettings | null;
  featuredItems: ContentItem[];
  newContentItems: ContentItem[];
}

// Preload images to prevent pop-in
function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.filter(Boolean).map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't block on failed images
          img.src = url;
        })
    )
  );
}

async function fetchContentItems(
  itemRefs: { item_id: string; item_type: string }[]
): Promise<ContentItem[]> {
  // Group items by type for batch fetching
  const collectionIds = itemRefs
    .filter((i) => i.item_type === "collection")
    .map((i) => i.item_id);
  const lifelineIds = itemRefs
    .filter((i) => i.item_type === "lifeline")
    .map((i) => i.item_id);
  const electionIds = itemRefs
    .filter((i) => i.item_type === "election")
    .map((i) => i.item_id);

  // Batch fetch all items in parallel
  const [collectionsResult, lifelinesResult, electionsResult] = await Promise.all([
    collectionIds.length > 0
      ? supabase
          .from("collections")
          .select(`
            id, title, slug, description, hero_image_url, card_image_url,
            hero_image:media_assets!collections_hero_image_id_fkey(url, alt_text)
          `)
          .in("id", collectionIds)
          .eq("status", "published")
      : Promise.resolve({ data: [] }),
    lifelineIds.length > 0
      ? supabase
          .from("lifelines")
          .select(`
            id, title, slug, intro, cover_image_url,
            cover_image_position_x, cover_image_position_y,
            cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text)
          `)
          .in("id", lifelineIds)
          .eq("status", "published")
      : Promise.resolve({ data: [] }),
    electionIds.length > 0
      ? supabase
          .from("mock_elections")
          .select(`
            id, title, slug, description, hero_image_url,
            hero_image_position_x, hero_image_position_y
          `)
          .in("id", electionIds)
          .eq("status", "published")
      : Promise.resolve({ data: [] }),
  ]);

  // Create lookup maps
  const collectionsMap = new Map(
    (collectionsResult.data || []).map((c: any) => [c.id, { ...c, type: "collection" as const }])
  );
  const lifelinesMap = new Map(
    (lifelinesResult.data || []).map((l: any) => [l.id, { ...l, type: "lifeline" as const }])
  );
  const electionsMap = new Map(
    (electionsResult.data || []).map((e: any) => [e.id, { ...e, type: "election" as const }])
  );

  // Preserve original order from itemRefs
  return itemRefs
    .map((ref) => {
      if (ref.item_type === "collection") return collectionsMap.get(ref.item_id);
      if (ref.item_type === "lifeline") return lifelinesMap.get(ref.item_id);
      if (ref.item_type === "election") return electionsMap.get(ref.item_id);
      return null;
    })
    .filter((item): item is ContentItem => item !== null);
}

export function useHomePageData() {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ["home-page-combined"],
    queryFn: async (): Promise<HomePageData> => {
      // Fetch all base data in parallel
      const [settingsResult, featuredResult, newContentResult] = await Promise.all([
        supabase
          .from("home_page_settings")
          .select(`*, hero_image:media_assets(url, alt_text)`)
          .single(),
        supabase
          .from("home_page_featured_items")
          .select("item_id, item_type")
          .order("order_index"),
        supabase
          .from("home_page_new_content_items")
          .select("item_id, item_type")
          .order("order_index"),
      ]);

      // Fetch content items in parallel batches
      const [featuredItems, newContentItems] = await Promise.all([
        fetchContentItems(featuredResult.data || []),
        fetchContentItems(newContentResult.data || []),
      ]);

      return {
        settings: settingsResult.data as HomePageSettings | null,
        featuredItems,
        newContentItems,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Preload images after data is fetched
  useEffect(() => {
    if (!data || imagesPreloaded) return;

    const imageUrls: string[] = [];

    // Hero image
    if (data.settings?.hero_image?.url) {
      imageUrls.push(data.settings.hero_image.url);
    }

    // First 6 content images (featured + new content)
    const allItems = [...data.featuredItems, ...data.newContentItems].slice(0, 6);
    allItems.forEach((item) => {
      const url =
        item.card_image_url ||
        item.hero_image?.url ||
        item.hero_image_url ||
        item.cover_image?.url ||
        item.cover_image_url;
      if (url) imageUrls.push(url);
    });

    preloadImages(imageUrls).then(() => setImagesPreloaded(true));
  }, [data, imagesPreloaded]);

  // Only show as loaded when both data is fetched AND images are preloaded
  const isLoading = isQueryLoading || (!!data && !imagesPreloaded);

  return {
    settings: data?.settings ?? null,
    featuredItems: data?.featuredItems ?? [],
    newContentItems: data?.newContentItems ?? [],
    isLoading,
  };
}

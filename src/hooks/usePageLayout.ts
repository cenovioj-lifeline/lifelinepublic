import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  PageLayout,
  PageLayoutItem,
  PageLayoutItemWithContent,
  PageLayoutSection,
  PageLayoutSectionWithItems,
  PageType,
  PageLayoutItemType,
  CardContent,
} from "@/types/pageLayout";
import { usePageLayoutSections } from "./usePageLayoutSections";

/**
 * Fetch layout for a specific page (home or collection)
 */
export function usePageLayout(pageType: PageType, entityId?: string) {
  return useQuery({
    queryKey: ["page-layout", pageType, entityId ?? "home"],
    queryFn: async () => {
      let query = supabase
        .from("page_layouts")
        .select("*")
        .eq("page_type", pageType);

      if (entityId) {
        query = query.eq("entity_id", entityId);
      } else {
        query = query.is("entity_id", null);
      }

      const { data, error } = await query.single();
      
      // PGRST116 = no rows found, which is okay for new pages
      if (error && error.code !== "PGRST116") throw error;
      return data as PageLayout | null;
    },
  });
}

/**
 * Fetch layout items for a specific layout
 */
export function usePageLayoutItems(layoutId: string | undefined) {
  return useQuery({
    queryKey: ["page-layout-items", layoutId],
    queryFn: async () => {
      if (!layoutId) return [];

      const { data, error } = await supabase
        .from("page_layout_items")
        .select("*")
        .eq("layout_id", layoutId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PageLayoutItem[];
    },
    enabled: !!layoutId,
  });
}

/**
 * Create or get layout for a page
 */
export function useCreatePageLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageType,
      entityId,
    }: {
      pageType: PageType;
      entityId?: string;
    }) => {
      // Try to get existing first
      let query = supabase
        .from("page_layouts")
        .select("*")
        .eq("page_type", pageType);

      if (entityId) {
        query = query.eq("entity_id", entityId);
      } else {
        query = query.is("entity_id", null);
      }

      const { data: existing } = await query.single();
      if (existing) return existing as PageLayout;

      // Create new
      const { data, error } = await supabase
        .from("page_layouts")
        .insert({ page_type: pageType, entity_id: entityId || null })
        .select()
        .single();

      if (error) throw error;
      return data as PageLayout;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout", variables.pageType, variables.entityId ?? "home"],
      });
    },
  });
}

/**
 * Add item to layout
 */
export function useAddLayoutItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      layoutId,
      itemType,
      itemId,
      displayOrder,
      customTitle,
      customSubtitle,
      customLink,
      customImageUrl,
      customImagePositionX,
      customImagePositionY,
      sectionId,
    }: {
      layoutId: string;
      itemType: PageLayoutItemType;
      itemId: string;
      displayOrder: number;
      customTitle?: string;
      customSubtitle?: string;
      customLink?: string;
      customImageUrl?: string;
      customImagePositionX?: number;
      customImagePositionY?: number;
      sectionId?: string;
    }) => {
      const { data, error } = await supabase
        .from("page_layout_items")
        .insert({
          layout_id: layoutId,
          item_type: itemType,
          item_id: itemId,
          display_order: displayOrder,
          custom_title: customTitle || null,
          custom_subtitle: customSubtitle || null,
          custom_link: customLink || null,
          custom_image_url: customImageUrl || null,
          custom_image_position_x: customImagePositionX ?? 50,
          custom_image_position_y: customImagePositionY ?? 50,
          section_id: sectionId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PageLayoutItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-items", data.layout_id],
      });
      // Also invalidate content cache to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["page-layout-content"],
      });
    },
  });
}

/**
 * Remove item from layout
 */
export function useRemoveLayoutItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      layoutId,
    }: {
      itemId: string;
      layoutId: string;
    }) => {
      const { error } = await supabase
        .from("page_layout_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return { layoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-items", data.layoutId],
      });
    },
  });
}

/**
 * Reorder items in layout
 */
export function useReorderLayoutItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      layoutId,
      items,
    }: {
      layoutId: string;
      items: { id: string; display_order: number }[];
    }) => {
      // Update each item's display_order
      const updates = items.map((item) =>
        supabase
          .from("page_layout_items")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      );

      await Promise.all(updates);
      return { layoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-items", data.layoutId],
      });
    },
  });
}

/**
 * Normalize content from different tables into CardContent format
 */
function normalizeContent(
  itemType: PageLayoutItemType,
  data: Record<string, any>
): CardContent {
  switch (itemType) {
    case "collection":
      return {
        title: data.title,
        subtitle: data.description,
        image_url: data.card_image_url || data.hero_image_url,
        slug: data.slug,
        link: `/public/collections/${data.slug}`,
      };
    case "profile":
      return {
        title: data.name,
        subtitle: data.short_description,
        image_url: data.primary_image_url,
        slug: data.slug,
        link: `/public/collections/${data.collections?.slug}/profiles/${data.slug}`,
      };
    case "lifeline":
      return {
        title: data.title,
        subtitle: data.subtitle || data.intro,
        image_url: data.cover_image_url,
        slug: data.slug,
        link: `/public/collections/${data.collections?.slug}/lifelines/${data.slug}`,
      };
    case "election":
      return {
        title: data.title,
        subtitle: data.description,
        image_url: data.hero_image_url,
        slug: data.slug,
        link: `/public/collections/${data.collections?.slug}/elections/${data.slug}`,
      };
    case "book":
      return {
        title: data.title,
        subtitle: `by ${data.author_name}`,
        image_url: data.cover_image_url,
        slug: data.slug,
        link: `/books/${data.slug}`,
      };
    case "action_card":
      return {
        title: data.name,
        icon_name: data.icon_name,
        icon_url: data.icon_url,
        slug: data.slug,
        isActionCard: true,
      };
    case "custom_link":
      return {
        title: data.custom_title || "Custom Link",
        subtitle: data.custom_subtitle,
        image_url: data.custom_image_url,
        image_position_x: data.custom_image_position_x ?? 50,
        image_position_y: data.custom_image_position_y ?? 50,
        link: data.custom_link,
      };
    default:
      return {
        title: data.title || data.name || "Unknown",
      };
  }
}

/**
 * Fetch content for a single item based on type
 */
async function fetchItemContent(
  item: PageLayoutItem
): Promise<PageLayoutItemWithContent> {
  const { item_type, item_id } = item;

  // Custom links don't need to fetch from another table
  if (item_type === "custom_link") {
    return {
      ...item,
      content: normalizeContent(item_type, {
        custom_title: item.custom_title,
        custom_subtitle: item.custom_subtitle,
        custom_link: item.custom_link,
        custom_image_url: item.custom_image_url,
        custom_image_position_x: (item as any).custom_image_position_x ?? 50,
        custom_image_position_y: (item as any).custom_image_position_y ?? 50,
      }),
    };
  }

  let data: Record<string, any> | null = null;

  switch (item_type) {
    case "collection": {
      const { data: collection } = await supabase
        .from("collections")
        .select("id, title, slug, description, card_image_url, hero_image_url")
        .eq("id", item_id)
        .single();
      data = collection;
      break;
    }
    case "profile": {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, slug, short_description, primary_image_url, primary_collection_id, collections:primary_collection_id(slug)")
        .eq("id", item_id)
        .single();
      data = profile;
      break;
    }
    case "lifeline": {
      const { data: lifeline } = await supabase
        .from("lifelines")
        .select("id, title, slug, subtitle, intro, cover_image_url, collection_id, collections(slug)")
        .eq("id", item_id)
        .single();
      data = lifeline;
      break;
    }
    case "election": {
      const { data: election } = await supabase
        .from("mock_elections")
        .select("id, title, slug, description, hero_image_url, collection_id, collections(slug)")
        .eq("id", item_id)
        .single();
      data = election;
      break;
    }
    case "book": {
      const { data: book } = await supabase
        .from("books")
        .select("id, title, slug, author_name, cover_image_url")
        .eq("id", item_id)
        .single();
      data = book;
      break;
    }
    case "action_card": {
      const { data: actionCard } = await supabase
        .from("action_cards")
        .select("id, name, slug, icon_name, icon_url")
        .eq("id", item_id)
        .single();
      data = actionCard;
      break;
    }
  }

  return {
    ...item,
    content: data ? normalizeContent(item_type, data) : null,
  };
}

/**
 * Hook to resolve all items' content
 */
export function useResolveLayoutContent(items: PageLayoutItem[]) {
  return useQuery({
    queryKey: ["page-layout-content", items.map((i) => `${i.item_type}:${i.item_id}`).join(",")],
    queryFn: async () => {
      if (items.length === 0) return [];

      // Fetch all content in parallel
      const results = await Promise.all(items.map(fetchItemContent));
      return results;
    },
    enabled: items.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Combined hook for fetching layout with resolved content
 * Convenience hook that combines layout, items, sections, and content resolution
 */
export function usePageLayoutWithContent(pageType: PageType, entityId?: string) {
  const { data: layout, isLoading: layoutLoading } = usePageLayout(pageType, entityId);
  const { data: sections = [], isLoading: sectionsLoading } = usePageLayoutSections(layout?.id);
  const { data: items = [], isLoading: itemsLoading } = usePageLayoutItems(layout?.id);
  const { data: itemsWithContent = [], isLoading: contentLoading } = useResolveLayoutContent(items);

  // Group items by section
  const sectionsWithItems: PageLayoutSectionWithItems[] = sections.map(section => ({
    ...section,
    items: itemsWithContent
      .filter(item => item.section_id === section.id)
      .sort((a, b) => a.display_order - b.display_order)
  }));
  
  // Items not assigned to any section
  const unsectionedItems = itemsWithContent
    .filter(item => !item.section_id)
    .sort((a, b) => a.display_order - b.display_order);

  return {
    layout,
    sections: sectionsWithItems,
    unsectionedItems,
    items: itemsWithContent, // Keep for backward compatibility
    isLoading: layoutLoading || sectionsLoading || itemsLoading || contentLoading,
    isEmpty: !layoutLoading && !itemsLoading && items.length === 0,
  };
}

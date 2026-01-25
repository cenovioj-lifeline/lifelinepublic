import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PageLayoutSection } from "@/types/pageLayout";
import { toast } from "@/hooks/use-toast";

/**
 * Fetch sections for a specific layout
 */
export function usePageLayoutSections(layoutId: string | undefined) {
  return useQuery({
    queryKey: ["page-layout-sections", layoutId],
    queryFn: async () => {
      if (!layoutId) return [];

      const { data, error } = await supabase
        .from("page_layout_sections")
        .select("*")
        .eq("layout_id", layoutId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PageLayoutSection[];
    },
    enabled: !!layoutId,
  });
}

/**
 * Create a new section
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      layoutId,
      sectionTitle,
      displayOrder,
      columnsCount = 3,
    }: {
      layoutId: string;
      sectionTitle?: string;
      displayOrder: number;
      columnsCount?: number;
    }) => {
      const { data, error } = await supabase
        .from("page_layout_sections")
        .insert({
          layout_id: layoutId,
          section_title: sectionTitle || null,
          display_order: displayOrder,
          columns_count: columnsCount,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PageLayoutSection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-sections", data.layout_id],
      });
      toast({ title: "Section added" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create section",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update section title or columns
 */
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      sectionTitle,
      columnsCount,
    }: {
      sectionId: string;
      sectionTitle?: string;
      columnsCount?: number;
    }) => {
      const updates: Partial<PageLayoutSection> = {};
      if (sectionTitle !== undefined) updates.section_title = sectionTitle || null;
      if (columnsCount !== undefined) updates.columns_count = columnsCount;

      const { data, error } = await supabase
        .from("page_layout_sections")
        .update(updates)
        .eq("id", sectionId)
        .select()
        .single();

      if (error) throw error;
      return data as PageLayoutSection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-sections", data.layout_id],
      });
    },
  });
}

/**
 * Delete a section (items will have section_id set to null)
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      layoutId,
    }: {
      sectionId: string;
      layoutId: string;
    }) => {
      const { error } = await supabase
        .from("page_layout_sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;
      return { layoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-sections", data.layoutId],
      });
      queryClient.invalidateQueries({
        queryKey: ["page-layout-items", data.layoutId],
      });
      toast({ title: "Section deleted" });
    },
  });
}

/**
 * Reorder sections
 */
export function useReorderSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      layoutId,
      sections,
    }: {
      layoutId: string;
      sections: { id: string; display_order: number }[];
    }) => {
      const updates = sections.map((section) =>
        supabase
          .from("page_layout_sections")
          .update({ display_order: section.display_order })
          .eq("id", section.id)
      );

      await Promise.all(updates);
      return { layoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-sections", data.layoutId],
      });
    },
  });
}

/**
 * Move item to a different section
 */
export function useMoveItemToSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      sectionId,
      layoutId,
    }: {
      itemId: string;
      sectionId: string | null;
      layoutId: string;
    }) => {
      const { error } = await supabase
        .from("page_layout_items")
        .update({ section_id: sectionId })
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
 * Ensure a default section exists for a layout
 */
export function useEnsureDefaultSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layoutId: string) => {
      // Check if any sections exist
      const { data: existingSections } = await supabase
        .from("page_layout_sections")
        .select("id")
        .eq("layout_id", layoutId)
        .limit(1);

      if (existingSections && existingSections.length > 0) {
        return existingSections[0];
      }

      // Create default section
      const { data, error } = await supabase
        .from("page_layout_sections")
        .insert({
          layout_id: layoutId,
          section_title: null,
          display_order: 0,
          columns_count: 3,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PageLayoutSection;
    },
    onSuccess: (_, layoutId) => {
      queryClient.invalidateQueries({
        queryKey: ["page-layout-sections", layoutId],
      });
    },
  });
}

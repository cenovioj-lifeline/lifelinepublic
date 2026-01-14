import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddLayoutItem } from "@/hooks/usePageLayout";
import type { PageType, PageLayoutItemType } from "@/types/pageLayout";

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutId: string | undefined;
  pageType: PageType;
  entityId: string | undefined;
  existingItemIds: string[];
  nextOrder: number;
}

export function AddCardModal({
  open,
  onOpenChange,
  layoutId,
  pageType,
  entityId,
  existingItemIds,
  nextOrder,
}: AddCardModalProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<PageLayoutItemType>("collection");

  const addItem = useAddLayoutItem();

  // Fetch available collections
  const { data: collections = [] } = useQuery({
    queryKey: ["available-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug, description, card_image_url, hero_image_url")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // Fetch profiles (scoped to collection if editing collection)
  const { data: profiles = [] } = useQuery({
    queryKey: ["available-profiles", entityId],
    queryFn: async () => {
      const query = supabase
        .from("profiles")
        .select("id, name, slug, tagline, profile_image_url, primary_collection_id")
        .eq("status", "published")
        .order("name");

      if (entityId) {
        query.eq("primary_collection_id", entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && pageType === "collection",
  });

  // Fetch lifelines (scoped to collection if editing collection)
  const { data: lifelines = [] } = useQuery({
    queryKey: ["available-lifelines", entityId],
    queryFn: async () => {
      const query = supabase
        .from("lifelines")
        .select("id, title, slug, intro, cover_image_url, collection_id")
        .eq("status", "published")
        .order("title");

      if (entityId) {
        query.eq("collection_id", entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && pageType === "collection",
  });

  // Fetch elections (scoped to collection if editing collection)
  const { data: elections = [] } = useQuery({
    queryKey: ["available-elections", entityId],
    queryFn: async () => {
      const query = supabase
        .from("mock_elections")
        .select("id, title, slug, subtitle, collection_id")
        .eq("status", "published")
        .order("title");

      if (entityId) {
        query.eq("collection_id", entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && pageType === "collection",
  });

  // Fetch books (global, not scoped)
  const { data: books = [] } = useQuery({
    queryKey: ["available-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, slug, author_name, cover_image_url")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // Fetch action cards (global)
  const { data: actionCards = [] } = useQuery({
    queryKey: ["available-action-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_cards")
        .select("id, name, slug, icon_name, icon_url")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // Filter out already-added items and apply search
  const filterAvailable = (items: any[], type: PageLayoutItemType) => {
    return items.filter(
      (item) =>
        !existingItemIds.includes(item.id) &&
        (item.name || item.title || "")
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  };

  // Handle adding a card
  const handleAdd = (itemType: PageLayoutItemType, itemId: string) => {
    if (!layoutId) return;

    addItem.mutate(
      {
        layoutId,
        itemType,
        itemId,
        displayOrder: nextOrder,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSearch("");
        },
      }
    );
  };

  // Determine which tabs to show based on context
  const availableTabs: { value: PageLayoutItemType; label: string }[] = [
    { value: "collection", label: "Collections" },
    ...(pageType === "collection"
      ? [
          { value: "profile" as const, label: "Profiles" },
          { value: "lifeline" as const, label: "Lifelines" },
          { value: "election" as const, label: "Awards" },
        ]
      : []),
    { value: "book", label: "Books" },
    { value: "action_card", label: "Actions" },
  ];

  const contentMap: Record<PageLayoutItemType, any[]> = {
    collection: filterAvailable(collections, "collection"),
    profile: filterAvailable(profiles, "profile"),
    lifeline: filterAvailable(lifelines, "lifeline"),
    election: filterAvailable(elections, "election"),
    book: filterAvailable(books, "book"),
    action_card: filterAvailable(actionCards, "action_card"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content type tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as PageLayoutItemType)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="w-full justify-start">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableTabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="flex-1 overflow-auto"
            >
              <div className="grid grid-cols-2 gap-3 p-1">
                {contentMap[tab.value].length === 0 ? (
                  <p className="col-span-2 text-center text-muted-foreground py-8">
                    No available {tab.label.toLowerCase()}
                  </p>
                ) : (
                  contentMap[tab.value].map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleAdd(tab.value, item.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {/* Thumbnail */}
                        {item.card_image_url ||
                        item.profile_image_url ||
                        item.cover_image_url ||
                        item.hero_image_url ? (
                          <img
                            src={
                              item.card_image_url ||
                              item.profile_image_url ||
                              item.cover_image_url ||
                              item.hero_image_url
                            }
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.name || item.title}
                          </p>
                          {(item.tagline ||
                            item.description ||
                            item.subtitle ||
                            item.author_name) && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.tagline ||
                                item.description ||
                                item.subtitle ||
                                item.author_name}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

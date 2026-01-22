import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CategoryLink {
  label: string;
  url: string;
  type: "internal" | "external";
}

interface StartCategory {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  links: CategoryLink[];
  display_order: number;
}

interface StartButtonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartButtonModal({ open, onOpenChange }: StartButtonModalProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | undefined>(undefined);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["start-button-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("start_button_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      // Parse links from JSONB
      return (data as any[]).map((cat) => ({
        ...cat,
        links: Array.isArray(cat.links) ? cat.links : [],
      })) as StartCategory[];
    },
    enabled: open,
  });

  // Auto-select first category when data loads
  const selected = categories?.find((c) => c.id === selectedId) || categories?.[0];

  const handleLinkClick = (link: CategoryLink) => {
    if (link.type === "external") {
      window.open(link.url, "_blank");
    } else {
      onOpenChange(false);
      navigate(link.url);
    }
  };

  // Handle accordion expansion with scroll-into-view
  const handleAccordionChange = useCallback((value: string | undefined) => {
    setExpandedAccordion(value);
    if (value) {
      // Small delay to let the accordion animate open, then scroll into view
      setTimeout(() => {
        const element = document.getElementById(`start-accordion-${value}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 150);
    }
  }, []);

  const renderCategoryNav = (category: StartCategory, isSelected: boolean) => (
    <button
      key={category.id}
      onClick={() => setSelectedId(category.id)}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        "hover:bg-accent/50",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{category.icon || "📌"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{category.title}</p>
          {category.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{category.subtitle}</p>
          )}
        </div>
      </div>
    </button>
  );

  const renderCategoryContent = (category: StartCategory) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{category.icon || "📌"}</span>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
          {category.subtitle && (
            <p className="text-muted-foreground">{category.subtitle}</p>
          )}
        </div>
      </div>
      {category.description && (
        <p className="text-foreground/80 leading-relaxed">{category.description}</p>
      )}
      {category.links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {category.links.map((link, idx) => (
            <Button
              key={idx}
              variant={idx === 0 ? "default" : "outline"}
              onClick={() => handleLinkClick(link)}
            >
              {link.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const renderLoading = () => (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // Mobile: Bottom sheet with accordion
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Get Started</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6">
            {isLoading ? (
              renderLoading()
            ) : (
              <Accordion
                type="single"
                collapsible
                className="w-full"
                value={expandedAccordion}
                onValueChange={handleAccordionChange}
              >
                {categories?.map((category) => (
                  <AccordionItem
                    key={category.id}
                    value={category.id}
                    id={`start-accordion-${category.id}`}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xl">{category.icon || "📌"}</span>
                        <div>
                          <p className="font-medium">{category.title}</p>
                          {category.subtitle && (
                            <p className="text-sm text-muted-foreground font-normal">
                              {category.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-10 space-y-3">
                        {category.description && (
                          <p className="text-foreground/80 text-sm leading-relaxed">
                            {category.description}
                          </p>
                        )}
                        {category.links.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {category.links.map((link, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant={idx === 0 ? "default" : "outline"}
                                onClick={() => handleLinkClick(link)}
                              >
                                {link.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog with split panels - responsive height
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] min-h-[500px] h-auto p-0 gap-0 overflow-hidden flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Left panel - navigation */}
          <div className="w-72 border-r bg-muted/30 flex flex-col min-h-0">
            <DialogHeader className="p-4 border-b shrink-0">
              <DialogTitle>Get Started</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoading
                  ? renderLoading()
                  : categories?.map((category) =>
                      renderCategoryNav(category, category.id === selected?.id)
                    )}
              </div>
            </ScrollArea>
          </div>

          {/* Right panel - content */}
          <div className="flex-1 p-6 overflow-auto">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : selected ? (
              renderCategoryContent(selected)
            ) : (
              <p className="text-muted-foreground">Select a category to get started</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Check } from "lucide-react";

interface Lifeline {
  id: string;
  title: string;
  lifeline_type: string;
  intro?: string | null;
  cover_image_url?: string | null;
}

interface LifelineSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lifelines: Lifeline[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

// Simple gradient based on index
const gradients = [
  "bg-linear-to-br from-violet-500 to-purple-600",
  "bg-linear-to-br from-pink-500 to-rose-500",
  "bg-linear-to-br from-sky-500 to-blue-600",
  "bg-linear-to-br from-emerald-500 to-teal-600",
  "bg-linear-to-br from-amber-500 to-orange-500",
  "bg-linear-to-br from-cyan-500 to-blue-500",
];

export function LifelineSelectorSheet({
  open,
  onOpenChange,
  lifelines,
  selectedId,
  onSelect,
  onCreateNew,
}: LifelineSelectorSheetProps) {
  const [search, setSearch] = useState("");

  const filteredLifelines = lifelines.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const getGradient = (index: number) => gradients[index % gradients.length];

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
    setSearch("");
  };

  const handleCreateNew = () => {
    onCreateNew();
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-0">
        <SheetHeader className="px-4 pb-3">
          <SheetTitle>Select Lifeline</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {lifelines.length} lifelines in this collection
          </p>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lifelines..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Lifeline List */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredLifelines.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {search ? "No lifelines match your search" : "No lifelines yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLifelines.map((lifeline) => {
                const isSelected = lifeline.id === selectedId;
                const originalIndex = lifelines.indexOf(lifeline);
                return (
                  <button
                    key={lifeline.id}
                    onClick={() => handleSelect(lifeline.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      isSelected
                        ? "bg-sky-50 ring-1 ring-sky-200"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Gradient square or cover image */}
                    <div
                      className={`w-12 h-12 rounded-lg shrink-0 ${
                        lifeline.cover_image_url
                          ? ""
                          : getGradient(originalIndex)
                      }`}
                      style={
                        lifeline.cover_image_url
                          ? {
                              backgroundImage: `url(${lifeline.cover_image_url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{lifeline.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {lifeline.lifeline_type === "person" ? "Person" : "List"}
                      </div>
                    </div>

                    {/* Check if selected */}
                    {isSelected && (
                      <Check className="h-5 w-5 text-sky-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create New */}
        <div className="p-4 border-t mt-auto">
          <Button
            variant="outline"
            className="w-full justify-center gap-1.5 text-sky-600 border-sky-200 hover:bg-sky-50"
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4" />
            Create New Lifeline
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

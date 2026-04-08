import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, Plus, Check } from "lucide-react";

interface Lifeline {
  id: string;
  title: string;
  lifeline_type: string;
  intro?: string | null;
  cover_image_url?: string | null;
}

interface LifelineSelectorDropdownProps {
  lifelines: Lifeline[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  loading?: boolean;
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

export function LifelineSelectorDropdown({
  lifelines,
  selectedId,
  onSelect,
  onCreateNew,
  loading = false,
}: LifelineSelectorDropdownProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selectedLifeline = lifelines.find((l) => l.id === selectedId);
  const filteredLifelines = lifelines.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const getGradient = (index: number) => gradients[index % gradients.length];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-w-[140px] max-w-[200px] justify-between"
          disabled={loading}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedLifeline ? (
              <>
                <span
                  className={`w-3 h-3 rounded shrink-0 ${getGradient(
                    lifelines.indexOf(selectedLifeline)
                  )}`}
                />
                <span className="truncate font-medium">
                  {selectedLifeline.title}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Select lifeline...</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {lifelines.length}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px] p-0">
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lifelines..."
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Lifeline List */}
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filteredLifelines.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {search ? "No lifelines match your search" : "No lifelines yet"}
            </div>
          ) : (
            filteredLifelines.map((lifeline, index) => {
              const isSelected = lifeline.id === selectedId;
              const originalIndex = lifelines.indexOf(lifeline);
              return (
                <button
                  key={lifeline.id}
                  onClick={() => {
                    onSelect(lifeline.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                    isSelected ? "bg-sky-50" : ""
                  }`}
                >
                  {/* Gradient square or cover image */}
                  <div
                    className={`w-10 h-10 rounded-lg shrink-0 ${
                      lifeline.cover_image_url ? "" : getGradient(originalIndex)
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
                    <div className="font-medium text-sm truncate">
                      {lifeline.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lifeline.lifeline_type === "person" ? "Person" : "List"}
                    </div>
                  </div>

                  {/* Check if selected */}
                  {isSelected && (
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create New */}
        <div className="p-2 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            onClick={() => {
              onCreateNew();
              setOpen(false);
              setSearch("");
            }}
          >
            <Plus className="h-4 w-4" />
            Create New Lifeline
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

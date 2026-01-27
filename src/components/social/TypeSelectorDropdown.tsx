import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

type ContentType = "lifelines" | "entries";

interface TypeSelectorDropdownProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
  lifelineCount: number;
  entryCount: number;
}

const typeConfig: Record<ContentType, { label: string; icon: string }> = {
  lifelines: { label: "Lifelines", icon: "📈" },
  entries: { label: "Entries", icon: "📝" },
};

export function TypeSelectorDropdown({
  value,
  onChange,
  lifelineCount,
  entryCount,
}: TypeSelectorDropdownProps) {
  const counts: Record<ContentType, number> = {
    lifelines: lifelineCount,
    entries: entryCount,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-w-[120px] justify-between"
        >
          <span className="flex items-center gap-1.5">
            <span>{typeConfig[value].icon}</span>
            <span className="font-medium">{typeConfig[value].label}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[180px]">
        {(Object.keys(typeConfig) as ContentType[]).map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onChange(type)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{typeConfig[type].icon}</span>
              <span>{typeConfig[type].label}</span>
            </span>
            <span
              className={`text-xs ${
                counts[type] > 0
                  ? "text-green-600 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {counts[type]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

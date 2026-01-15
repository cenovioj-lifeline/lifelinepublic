import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ExternalLink, Pencil } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PageLayoutItemWithContent } from "@/types/pageLayout";
import { itemTypeBadgeColors, itemTypeLabels } from "@/types/pageLayout";

interface SortablePageLayoutCardProps {
  item: PageLayoutItemWithContent;
  onRemove: () => void;
  onEdit?: () => void;
}

export function SortablePageLayoutCard({
  item,
  onRemove,
  onEdit,
}: SortablePageLayoutCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { item_type, content } = item;

  if (!content) {
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <Card className="h-48 flex items-center justify-center bg-destructive/10">
          <p className="text-destructive text-sm">Content not found</p>
        </Card>
      </div>
    );
  }

  // Action cards render differently (icon-focused)
  if (content.isActionCard) {
    const IconComponent = content.icon_name
      ? (LucideIcons as any)[content.icon_name]
      : null;

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <Card className="relative group">
          {/* Drag handle */}
          <div
            {...listeners}
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 cursor-grab"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Edit and Remove buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <CardContent className="p-6 flex flex-col items-center justify-center h-32">
            {IconComponent && <IconComponent className="w-8 h-8 mb-2" />}
            <span className="font-medium">{content.title}</span>
            <Badge
              className={itemTypeBadgeColors[item_type]}
              variant="secondary"
            >
              {itemTypeLabels[item_type]}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Standard content cards
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="relative group overflow-hidden">
        {/* Drag handle */}
        <div
          {...listeners}
          className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 cursor-grab bg-white/80 rounded p-1"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Edit and Remove buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100">
          {onEdit && (
            <Button variant="ghost" size="icon" className="bg-white/80" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="bg-white/80" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        {/* Card image */}
        {content.image_url ? (
          <div className="aspect-video bg-muted">
            <img
              src={content.image_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        <CardContent className="p-4">
          {/* Type badge */}
          <Badge
            className={`${itemTypeBadgeColors[item_type]} mb-2`}
            variant="secondary"
          >
            {itemTypeLabels[item_type]}
          </Badge>

          {/* Title */}
          <h3 className="font-medium line-clamp-1">{content.title}</h3>

          {/* Subtitle */}
          {content.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {content.subtitle}
            </p>
          )}

          {/* Link indicator */}
          {content.link && (
            <a
              href={content.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Preview
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface LifelineInfoCardProps {
  title: string;
  description: string;
  lifelineType: string;
  entryCount: number;
  coverImageUrl?: string;
  onEditClick: () => void;
}

export function LifelineInfoCard({
  title,
  description,
  lifelineType,
  entryCount,
  coverImageUrl,
  onEditClick,
}: LifelineInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Cover Image */}
      <div className="aspect-16/7 relative">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500" />
        )}

        {/* Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 rounded-md text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          Lifeline
        </span>

        {/* Edit Button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3 bg-white/95 hover:bg-white shadow-xs"
          onClick={onEditClick}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        )}

        {/* Meta */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            <strong className="text-gray-600">Type:</strong> {lifelineType === "list" ? "List" : "Person"}
          </span>
          <span className="text-xs text-gray-400">
            <strong className="text-gray-600">Entries:</strong> {entryCount}
          </span>
        </div>
      </div>
    </div>
  );
}

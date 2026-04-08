import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

interface VideoCardProps {
  title: string;
  description?: string | null;
  youtubeUrl: string;
  thumbnailUrl?: string | null;
}

export function VideoCard({
  title,
  description,
  youtubeUrl,
  thumbnailUrl,
}: VideoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const videoId = extractYouTubeId(youtubeUrl);
  const thumbnail = thumbnailUrl || (videoId ? getYouTubeThumbnail(videoId) : null);

  return (
    <>
      <div
        className="flex flex-col bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow aspect-2/3"
        onClick={() => setModalOpen(true)}
      >
        {/* Thumbnail Section - Top ~40% */}
        <div className="relative w-full h-[40%] bg-muted overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Play className="w-12 h-12 text-primary/50" />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-7 h-7 text-primary fill-primary ml-1" />
            </div>
          </div>
        </div>

        {/* Content Section - Bottom ~60% */}
        <div className="flex-1 flex flex-col p-4 justify-between">
          <div className="flex-1 min-h-0">
            <h3 className="font-bold text-foreground text-base mb-2 line-clamp-2">
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground text-sm line-clamp-4">
                {description}
              </p>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            className="mt-3 w-full"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Video
          </Button>
        </div>
      </div>

      <VideoPlayerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={title}
        description={description}
        youtubeUrl={youtubeUrl}
      />
    </>
  );
}

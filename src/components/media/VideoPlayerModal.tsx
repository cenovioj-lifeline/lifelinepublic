import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";

interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | null;
  youtubeUrl: string;
}

export function VideoPlayerModal({
  open,
  onOpenChange,
  title,
  description,
  youtubeUrl,
}: VideoPlayerModalProps) {
  const videoId = extractYouTubeId(youtubeUrl);
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* Video Player */}
          {embedUrl ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
              <p className="text-muted-foreground">Video unavailable</p>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2, Mail } from "lucide-react";
import { Facebook, Twitter, Linkedin } from "lucide-react";

interface CollectionShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionSlug?: string;
  collectionTitle?: string;
  shareUrl?: string;
  shareTitle?: string;
  shareDescription?: string;
}

export function CollectionShareModal({
  open,
  onOpenChange,
  collectionSlug,
  collectionTitle,
  shareUrl: customShareUrl,
  shareTitle: customShareTitle,
  shareDescription,
}: CollectionShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = customShareUrl || `${window.location.origin}/public/collections/${collectionSlug}`;
  const title = customShareTitle || collectionTitle || "";
  const description = shareDescription || `Check out ${title}`;

  // Check if Web Share API is supported
  const canShare = typeof navigator !== "undefined" && navigator.share !== undefined;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: title,
        text: description,
        url: url,
      });
      toast({
        title: "Shared successfully!",
        description: "Thanks for sharing",
      });
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "URL has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Share {title} with your friends and followers
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Native Share Button (mobile) */}
          {canShare && (
            <Button
              onClick={handleNativeShare}
              className="w-full"
              size="lg"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          )}

          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleSocialShare("facebook")}
              className="w-full"
            >
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialShare("twitter")}
              className="w-full"
            >
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialShare("linkedin")}
              className="w-full"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialShare("whatsapp")}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialShare("email")}
              className="w-full col-span-2"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>

          {/* Copy Link */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            <div className="grid flex-1 gap-2">
              <Input
                value={url}
                readOnly
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleCopy}
              variant="outline"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

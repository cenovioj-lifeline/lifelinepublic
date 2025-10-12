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
import { Copy, Check } from "lucide-react";

interface CollectionShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionSlug: string;
  collectionTitle: string;
}

export function CollectionShareModal({
  open,
  onOpenChange,
  collectionSlug,
  collectionTitle,
}: CollectionShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/public/collections/${collectionSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Collection URL has been copied to clipboard",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Collection</DialogTitle>
          <DialogDescription>
            Share {collectionTitle} with others by copying this link
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm"
            />
          </div>
          <Button
            type="button"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

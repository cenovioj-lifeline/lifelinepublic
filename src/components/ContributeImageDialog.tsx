import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadImage, createMediaAsset, getImageDimensions } from "@/lib/storage";
import { Upload, X, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContributeImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  entryTitle: string;
  lifelineId: string;
  onSignInRequired: () => void;
}

export function ContributeImageDialog({
  open,
  onOpenChange,
  entryId,
  entryTitle,
  lifelineId,
  onSignInRequired,
}: ContributeImageDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        onSignInRequired();
        throw new Error("Not authenticated");
      }

      if (!selectedFile) {
        throw new Error("No file selected");
      }

      // Upload image to storage
      const { url } = await uploadImage(selectedFile);
      
      // Get image dimensions
      const dimensions = await getImageDimensions(selectedFile);
      
      // Create media asset
      const mediaAsset = await createMediaAsset(selectedFile, url, dimensions);

      // Create fan contribution for image
      const { error } = await supabase.from("fan_contributions").insert({
        user_id: user.id,
        lifeline_id: lifelineId,
        entry_ref: entryId,
        media_id: mediaAsset.id,
        contribution_type: "image",
        title: null,
        description: null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      toast.success("Image submitted for review!");
      setSelectedFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.message !== "Not authenticated") {
        toast.error("Failed to submit image");
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to create a free account to contribute images.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to contribute images to this event.
            </p>
            <Button onClick={onSignInRequired} className="w-full">
              Sign In / Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contribute an Image</DialogTitle>
          <DialogDescription>
            Submit an image for "{entryTitle}". Your contribution will be reviewed by
            our team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <Trophy className="h-4 w-4" />
            <AlertDescription>
              We will be creating a Hall of Fame to showcase our most prolific contributors!
            </AlertDescription>
          </Alert>
          
          <div>
            <Label htmlFor="image">Select Image *</Label>
            {!previewUrl ? (
              <div className="mt-2">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-2 relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!selectedFile || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

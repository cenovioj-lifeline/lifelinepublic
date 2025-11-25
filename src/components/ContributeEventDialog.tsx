import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy } from "lucide-react";
import { uploadImage } from "@/lib/storage";
import { Loader2 } from "lucide-react";
import { useSuperFan } from "@/hooks/useSuperFan";

interface ContributeEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lifelineId: string;
  lifelineTitle: string;
  onSignInRequired: () => void;
  contributePictureMode?: boolean;
  initialEntryId?: string;
}

export function ContributeEventDialog({
  open,
  onOpenChange,
  lifelineId,
  lifelineTitle,
  onSignInRequired,
  contributePictureMode = false,
  initialEntryId,
}: ContributeEventDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isSuperFan } = useSuperFan();
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState(initialEntryId || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch entries for the lifeline when in picture mode
  const { data: entries } = useQuery({
    queryKey: ["lifeline-entries", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, title")
        .eq("lifeline_id", lifelineId)
        .order("order_index");
      
      if (error) throw error;
      return data;
    },
    enabled: contributePictureMode && !!lifelineId,
  });

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (open) {
      setSelectedEntryId(initialEntryId || "");
    } else {
      setTitle("");
      setScore("");
      setDescription("");
      setImageFile(null);
      setSelectedEntryId("");
    }
  }, [open, initialEntryId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        onSignInRequired();
        throw new Error("Not authenticated");
      }

      const contributionStatus = isSuperFan ? 'auto_approved' : 'pending';

      if (contributePictureMode) {
        // Upload image first
        if (!imageFile) {
          throw new Error("Please select an image");
        }
        if (!selectedEntryId) {
          throw new Error("Please select an event");
        }

        setUploading(true);
        const { url, path } = await uploadImage(imageFile);
        
        // Create media asset
        const { data: mediaAsset, error: mediaError } = await supabase
          .from("media_assets")
          .insert({
            url,
            filename: imageFile.name,
            type: "image",
          })
          .select()
          .single();

        if (mediaError) throw mediaError;

        // For super fans, immediately create entry_images record
        if (isSuperFan) {
          await supabase.from('entry_images').insert({
            entry_id: selectedEntryId,
            image_url: url,
            image_path: path,
            locked: false
          });
        }

        // Create contribution
        const { error } = await supabase.from("fan_contributions").insert({
          user_id: user.id,
          lifeline_id: lifelineId,
          contribution_type: "image",
          entry_ref: selectedEntryId,
          media_id: mediaAsset.id,
          status: contributionStatus
        });

        if (error) throw error;
      } else {
        // Event contribution
        const { error } = await supabase.from("fan_contributions").insert({
          user_id: user.id,
          lifeline_id: lifelineId,
          contribution_type: "event",
          title,
          score: score ? parseInt(score) : null,
          description,
          status: contributionStatus
        });

        if (error) throw error;

        // For super fans, immediately create the entry
        if (isSuperFan) {
          await supabase.from('entries').insert({
            lifeline_id: lifelineId,
            title,
            score: score ? parseInt(score) : null,
            details: description,
            contribution_status: 'auto_approved',
            is_fan_contributed: true,
            contributed_by_user_id: user.id,
            order_index: 999 // Will be reordered by admin
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["lifeline"] });
      
      if (isSuperFan) {
        toast.success(contributePictureMode 
          ? "Your image is now live and visible to everyone!"
          : "Your event is now live and visible to everyone!");
      } else {
        toast.success("Contribution submitted for review!");
      }
      
      setTitle("");
      setScore("");
      setDescription("");
      setImageFile(null);
      setSelectedEntryId("");
      setUploading(false);
      onOpenChange(false);
    },
    onError: (error) => {
      setUploading(false);
      if (error.message !== "Not authenticated") {
        toast.error(error.message || "Failed to submit contribution");
      }
    },
  });

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to create a free account to submit events to lifelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to contribute to {lifelineTitle} and other lifelines.
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
      <DialogContent className="max-w-2xl" style={{ backgroundColor: "#FFFFFF" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#333333" }}>
            {contributePictureMode ? "Add a Picture to an Event" : "Contribute a New Event"}
          </DialogTitle>
          <DialogDescription style={{ color: "#666666" }}>
            {contributePictureMode 
              ? `Submit an image for an event in ${lifelineTitle}. Your contribution will be reviewed by our team.`
              : `Submit a new event for ${lifelineTitle}. Your contribution will be reviewed by our team.`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert style={{ backgroundColor: "#F5F5F5", borderColor: "#E0E0E0" }}>
            <Trophy className="h-4 w-4" style={{ color: "#333333" }} />
            <AlertDescription style={{ color: "#333333" }}>
              We will be creating a Hall of Fame to showcase our most prolific contributors!
            </AlertDescription>
          </Alert>
          
          <div>
            <Label htmlFor="lifeline" style={{ color: "#333333" }}>
              {contributePictureMode ? "Lifeline" : "Contributing to Lifeline"}
            </Label>
            <Input
              id="lifeline"
              value={lifelineTitle}
              disabled
              style={{ 
                backgroundColor: "#F5F5F5", 
                color: "#666666",
                cursor: "not-allowed"
              }}
            />
          </div>

          {contributePictureMode ? (
            <>
              <div>
                <Label htmlFor="event-select" style={{ color: "#333333" }}>Select Event *</Label>
                <Select value={selectedEntryId} onValueChange={setSelectedEntryId}>
                  <SelectTrigger id="event-select" style={{ 
                    backgroundColor: "hsl(var(--scheme-card-bg))", 
                    color: "hsl(var(--scheme-cards-text))",
                    borderColor: "hsl(var(--scheme-card-border))"
                  }}>
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent style={{ 
                    backgroundColor: "hsl(var(--scheme-card-bg))", 
                    borderColor: "hsl(var(--scheme-card-border))",
                    zIndex: 9999 
                  }}>
                    {entries?.map((entry) => (
                      <SelectItem 
                        key={entry.id} 
                        value={entry.id}
                        style={{ color: "hsl(var(--scheme-cards-text))" }}
                      >
                        {entry.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="image-upload" style={{ color: "#333333" }}>Upload Image *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: "#E0E0E0" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {imageFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm" style={{ color: "#333333" }}>{imageFile.name}</p>
                        <p className="text-xs" style={{ color: "#666666" }}>
                          ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm" style={{ color: "#666666" }}>Click to select an image</p>
                        <p className="text-xs" style={{ color: "#999999" }}>
                          Max 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="title" style={{ color: "#333333" }}>Event Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  required
                  style={{ backgroundColor: "#FFFFFF", color: "#333333" }}
                />
              </div>
              <div>
                <Label htmlFor="score" style={{ color: "#333333" }}>Rating (optional)</Label>
                <Select value={score} onValueChange={setScore}>
                  <SelectTrigger id="score" style={{ 
                    backgroundColor: "hsl(var(--scheme-card-bg))", 
                    color: "hsl(var(--scheme-cards-text))",
                    borderColor: "hsl(var(--scheme-card-border))"
                  }}>
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                  <SelectContent style={{ 
                    backgroundColor: "hsl(var(--scheme-card-bg))", 
                    borderColor: "hsl(var(--scheme-card-border))",
                    zIndex: 9999 
                  }}>
                    {Array.from({ length: 21 }, (_, i) => i - 10).map((value) => (
                      <SelectItem 
                        key={value} 
                        value={value.toString()}
                        style={{ color: "hsl(var(--scheme-cards-text))" }}
                      >
                        {value > 0 ? `+${value}` : value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" style={{ color: "#333333" }}>Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the event..."
                  rows={5}
                  required
                  style={{ backgroundColor: "#FFFFFF", color: "#333333" }}
                />
              </div>
            </>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              style={{ color: "#333333" }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={
                contributePictureMode 
                  ? !selectedEntryId || !imageFile || submitMutation.isPending || uploading
                  : !title || !description || submitMutation.isPending
              }
            >
              {submitMutation.isPending || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                "Submit Contribution"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

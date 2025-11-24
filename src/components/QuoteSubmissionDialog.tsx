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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Search } from "lucide-react";

interface QuoteSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionTitle: string;
  onSignInRequired: () => void;
}

export function QuoteSubmissionDialog({
  open,
  onOpenChange,
  collectionId,
  collectionTitle,
  onSignInRequired,
}: QuoteSubmissionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quoteText, setQuoteText] = useState("");
  const [author, setAuthor] = useState("");
  const [context, setContext] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profileSearch, setProfileSearch] = useState("");

  // Fetch profiles for the dropdown
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-quote", profileSearch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, name, slug")
        .eq("status", "published")
        .order("name");

      if (profileSearch) {
        query = query.ilike("name", `%${profileSearch}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setQuoteText("");
      setAuthor("");
      setContext("");
      setSelectedProfileId("");
      setProfileSearch("");
    }
  }, [open]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        onSignInRequired();
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("fan_contributions").insert({
        user_id: user.id,
        lifeline_id: collectionId,
        contribution_type: "quote",
        quote_text: quoteText,
        quote_author: author || null,
        quote_author_profile_id: selectedProfileId || null,
        quote_context: context || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      toast.success("Quote submitted for review!");
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.message !== "Not authenticated") {
        toast.error("Failed to submit quote");
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
              You need to create a free account to submit quotes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to contribute quotes to {collectionTitle}.
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
          <DialogTitle>Submit a Quote</DialogTitle>
          <DialogDescription>
            Share a memorable quote from {collectionTitle}. Your submission will be
            reviewed by our team.
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
            <Label htmlFor="quoteText">Quote *</Label>
            <Textarea
              id="quoteText"
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Enter the quote..."
              rows={4}
              required
            />
          </div>
          <div>
            <Label htmlFor="profile">Who said it? (optional)</Label>
            <Select value={selectedProfileId} onValueChange={(value) => {
              setSelectedProfileId(value);
              const profile = profiles?.find(p => p.id === value);
              if (profile) {
                setAuthor(profile.name);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a person or character" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search people..."
                      value={profileSearch}
                      onChange={(e) => setProfileSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <SelectItem value="">None selected (enter name below)</SelectItem>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="author">Or enter name manually (if not in list)</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                setSelectedProfileId("");
              }}
              placeholder="Character or person name"
            />
          </div>
          <div>
            <Label htmlFor="context">Context (optional)</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Season, episode, or situation"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!quoteText.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quote"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

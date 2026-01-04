import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useCollectionRole } from "@/hooks/useCollectionRole";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, Plus, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CollectionClaim() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState(user?.email || "");
  const [claimReason, setClaimReason] = useState("");
  const [proofLinks, setProofLinks] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch collection
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check existing role
  const { role, loading: roleLoading } = useCollectionRole(collection?.id);

  // Check existing request
  const { data: existingRequest, isLoading: requestLoading } = useQuery({
    queryKey: ["ownership-request", collection?.id, user?.id],
    queryFn: async () => {
      if (!collection?.id || !user?.id) return null;
      
      const { data, error } = await supabase
        .from("collection_ownership_requests")
        .select("*")
        .eq("collection_id", collection.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!collection?.id && !!user?.id,
  });

  // Submit request mutation
  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!collection?.id || !user?.id) throw new Error("Missing data");
      
      const filteredLinks = proofLinks.filter(link => link.trim() !== "");
      
      const { error } = await supabase
        .from("collection_ownership_requests")
        .insert({
          collection_id: collection.id,
          user_id: user.id,
          email: email,
          claim_reason: claimReason,
          proof_links: filteredLinks,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your ownership request has been submitted for review.",
      });
      // Refresh to show the pending state
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
      console.error("Submit error:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (!claimReason.trim()) {
      toast({ title: "Please explain why you're claiming this collection", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    await submitRequest.mutateAsync();
    setIsSubmitting(false);
  };

  const addProofLink = () => {
    setProofLinks([...proofLinks, ""]);
  };

  const removeProofLink = (index: number) => {
    setProofLinks(proofLinks.filter((_, i) => i !== index));
  };

  const updateProofLink = (index: number, value: string) => {
    const updated = [...proofLinks];
    updated[index] = value;
    setProofLinks(updated);
  };

  const isLoading = collectionLoading || roleLoading || requestLoading;

  if (isLoading || !collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div>Loading...</div>
      </CollectionLayout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <CollectionLayout
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        collectionId={collection.id}
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You must be signed in to claim ownership of a collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/public/collections/${slug}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </CollectionLayout>
    );
  }

  // Already has a role
  if (role) {
    return (
      <CollectionLayout
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        collectionId={collection.id}
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Already a Member</CardTitle>
            <CardDescription>
              You already have the role of <strong>{role}</strong> in this collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/public/collections/${slug}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </CollectionLayout>
    );
  }

  // Has existing request
  if (existingRequest) {
    const statusConfig = {
      pending: { icon: Clock, color: "text-yellow-600", title: "Request Pending" },
      approved: { icon: CheckCircle, color: "text-green-600", title: "Request Approved" },
      denied: { icon: AlertCircle, color: "text-red-600", title: "Request Denied" },
      more_info_needed: { icon: AlertCircle, color: "text-orange-600", title: "More Information Needed" },
    };
    
    const status = statusConfig[existingRequest.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <CollectionLayout
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        collectionId={collection.id}
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${status.color}`} />
              {status.title}
            </CardTitle>
            <CardDescription>
              {existingRequest.status === "pending" && 
                "Your request is being reviewed. We'll contact you at the email provided."}
              {existingRequest.status === "approved" && 
                "Congratulations! You now have ownership of this collection."}
              {existingRequest.status === "denied" && 
                "Your request was not approved. See admin notes below for details."}
              {existingRequest.status === "more_info_needed" && 
                "Please check your email for instructions on what additional information is needed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingRequest.admin_notes && (
              <Alert>
                <AlertTitle>Admin Notes</AlertTitle>
                <AlertDescription>{existingRequest.admin_notes}</AlertDescription>
              </Alert>
            )}
            <Button onClick={() => navigate(`/public/collections/${slug}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </CollectionLayout>
    );
  }

  // Show claim form
  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Claim This Collection</CardTitle>
          <CardDescription>
            Request ownership of <strong>{collection.title}</strong>. Our team will verify your identity
            before granting access. This process typically involves confirming your identity through
            LinkedIn or other professional channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll use this email to coordinate identity verification.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Why are you claiming this collection? *</Label>
              <Textarea
                id="reason"
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                placeholder="Explain your connection to this collection and why you should have ownership..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Proof Links (LinkedIn, Twitter, Website, etc.)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Provide links that help verify your identity and connection to this collection.
              </p>
              {proofLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => updateProofLink(index, e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {proofLinks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProofLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProofLink}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Another Link
              </Button>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/public/collections/${slug}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CollectionLayout>
  );
}

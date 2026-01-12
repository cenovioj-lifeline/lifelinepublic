import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActionCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  icon_url: string | null;
  is_implemented: boolean;
  implementation_notes: string | null;
  is_default: boolean;
  default_order: number;
  status: string;
  created_at: string;
}

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
  if (!name) return null;
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
};

export default function ActionCards() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: actionCards, isLoading } = useQuery({
    queryKey: ["action-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_cards")
        .select("*")
        .order("is_default", { ascending: false })
        .order("default_order")
        .order("name");
      if (error) throw error;
      return data as ActionCard[];
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
      const { error } = await supabase
        .from("action_cards")
        .update({ is_default: isDefault })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      toast({
        title: "Updated",
        description: "Default status has been updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("action_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      toast({
        title: "Deleted",
        description: "Action card has been deleted",
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not delete action card. It may be in use by collections.",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Action Cards</h1>
            <p className="text-muted-foreground">
              Manage action cards that appear below collection hero images
            </p>
          </div>
          <Button onClick={() => navigate("/admin/action-cards/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Action Card
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actionCards?.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {card.icon_url ? (
                        <img src={card.icon_url} alt="" className="h-6 w-6" />
                      ) : (
                        <DynamicIcon name={card.icon_name} className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {card.name}
                        {card.is_default && (
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        )}
                      </CardTitle>
                      <code className="text-xs text-muted-foreground">{card.slug}</code>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {card.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={card.status === "active" ? "default" : "secondary"}>
                    {card.status}
                  </Badge>
                  {card.is_default && (
                    <Badge variant="outline">Default #{card.default_order}</Badge>
                  )}
                  <Badge variant={card.is_implemented ? "default" : "destructive"}>
                    {card.is_implemented ? (
                      <><Check className="h-3 w-3 mr-1" /> Implemented</>
                    ) : (
                      <><X className="h-3 w-3 mr-1" /> Not Implemented</>
                    )}
                  </Badge>
                </div>

                {!card.is_implemented && (
                  <p className="text-xs text-muted-foreground italic">
                    Work with Claude Code to implement this action
                  </p>
                )}

                {card.is_implemented && card.implementation_notes && (
                  <p className="text-xs text-muted-foreground">
                    {card.implementation_notes}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/action-cards/${card.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {!card.is_default ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate({ id: card.id, isDefault: true })}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Make Default
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate({ id: card.id, isDefault: false })}
                    >
                      <Star className="mr-2 h-4 w-4 fill-current" />
                      Remove Default
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {actionCards?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No action cards yet. Create your first one!
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action Card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If this card is assigned to any collections,
              they will fall back to showing default cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

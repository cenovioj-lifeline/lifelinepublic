import { useState } from "react";
import { Lock, LockOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

interface ImageLockToggleProps {
  entryMediaId: string;
  isLocked: boolean;
  onLockChange: () => void;
}

export function ImageLockToggle({ entryMediaId, isLocked, onLockChange }: ImageLockToggleProps) {
  const [updating, setUpdating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent carousel navigation
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("entry_media")
        .update({ locked: !isLocked })
        .eq("id", entryMediaId);

      if (error) throw error;

      toast.success(isLocked ? "Image unlocked" : "Image locked");
      onLockChange();
    } catch (error) {
      console.error("Lock toggle error:", error);
      toast.error("Failed to toggle lock");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={updating}
      className="absolute top-2 left-2 z-10 bg-black/50 hover:bg-black/70"
      title={isLocked ? "Unlock image" : "Lock image"}
    >
      {updating ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : isLocked ? (
        <Lock className="h-4 w-4 text-green-400" />
      ) : (
        <LockOpen className="h-4 w-4 text-gray-400" />
      )}
    </Button>
  );
}

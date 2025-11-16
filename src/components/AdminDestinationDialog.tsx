import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Home, Shield } from "lucide-react";

interface AdminDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDestinationDialog({ open, onOpenChange }: AdminDestinationDialogProps) {
  const navigate = useNavigate();

  const handleDestination = (destination: string) => {
    navigate(destination);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome Back!</DialogTitle>
          <DialogDescription>
            Where would you like to go?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => handleDestination("/")}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <Home className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Lifeline Public Home</div>
              <div className="text-xs text-muted-foreground">Browse content</div>
            </div>
          </Button>

          <Button
            onClick={() => handleDestination("/admin")}
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <Shield className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Admin Home</div>
              <div className="text-xs text-muted-foreground">Manage content</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GrowComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrowComingSoonDialog({ open, onOpenChange }: GrowComingSoonDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Professional Development - Coming Soon</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              The Grow feature is coming soon! In your profile, you'll find a Professional 
              Development module where you can save Lifeline content to create personalized 
              learning paths and development opportunities.
            </p>
            <p>
              Curate insights from books—key takeaways, frameworks, and memorable quotes. 
              Save pivotal moments and stories from lifelines that resonate with you. Build 
              your own collection of the rich content across the site, all organized around 
              your growth.
            </p>
            <p className="font-medium">Stay tuned!</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

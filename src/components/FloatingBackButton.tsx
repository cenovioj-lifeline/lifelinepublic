import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { getBackNavigation } from "@/lib/backNavigation";

interface FloatingBackButtonProps {
  /** Optional explicit back path - overrides smart navigation */
  backTo?: string;
  /** Optional explicit label for accessibility */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A floating back button for mobile devices.
 * Appears fixed at the bottom-left of the screen.
 * Uses smart navigation to determine the logical parent route.
 */
export function FloatingBackButton({ backTo, label, className }: FloatingBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }

    // Try smart navigation
    const backNav = getBackNavigation(location.pathname, params);
    if (backNav) {
      navigate(backNav.parentPath);
    } else {
      // Fallback to browser history
      navigate(-1);
    }
  };

  const accessibilityLabel = label || "Go back";

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleBack}
      aria-label={accessibilityLabel}
      className={`fixed bottom-4 left-4 z-50 rounded-full shadow-lg 
        h-12 w-12 bg-background/90 backdrop-blur-sm 
        border border-border hover:bg-accent
        transition-all duration-200 hover:scale-105
        ${className || ""}`}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ContributionStatusBadgeProps {
  status: string;
  adminMessage?: string | null;
}

export function ContributionStatusBadge({ status, adminMessage }: ContributionStatusBadgeProps) {
  if (status === 'approved') {
    return null; // Don't show badge for approved content
  }

  const getBadgeConfig = () => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'Pending Review',
          color: 'text-yellow-600'
        };
      case 'auto_approved':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: 'Published',
          color: 'text-green-600'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          text: 'Needs Revision',
          color: 'text-red-600'
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const Icon = config.icon;

  const badge = (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );

  if (status === 'rejected' && adminMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{adminMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

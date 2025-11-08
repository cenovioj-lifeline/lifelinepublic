import { cn } from '@/lib/utils';

interface GraphBarProps {
  rating: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}

export const GraphBar = ({ rating, isActive, isPast, onClick }: GraphBarProps) => {
  const isPositive = rating >= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative transition-all duration-200 flex-shrink-0",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        isActive ? "scale-125 z-10" : "scale-100"
      )}
      style={{
        width: '48px',
        height: '44px',
      }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-md transition-all duration-200 flex items-center justify-center",
          "border-2",
          isActive && isPositive && "bg-green-500 border-green-600 shadow-lg",
          isActive && !isPositive && "bg-red-500 border-red-600 shadow-lg",
          !isActive && isPast && isPositive && "bg-green-400/70 border-green-500/50",
          !isActive && isPast && !isPositive && "bg-red-400/70 border-red-500/50",
          !isActive && !isPast && isPositive && "bg-green-400/60 border-green-500/40",
          !isActive && !isPast && !isPositive && "bg-red-400/60 border-red-500/40"
        )}
      >
        <span 
          className={cn(
            "text-xs font-bold transition-colors",
            isActive ? "text-white" : "text-foreground/70"
          )}
        >
          {rating >= 0 ? '+' : ''}{rating}
        </span>
      </div>
    </button>
  );
};

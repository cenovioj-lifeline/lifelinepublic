import { cn } from '@/lib/utils';

interface GraphBarProps {
  rating: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}

export const GraphBar = ({ rating, isActive, isPast, onClick }: GraphBarProps) => {
  const height = Math.abs(rating) * 2 + 20; // Min 20px, scale by rating
  const isPositive = rating >= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-sm",
        isActive && "animate-pulse"
      )}
      style={{
        width: '4px',
        height: `${height}px`,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-300",
          isActive && "shadow-lg shadow-primary/50 scale-105",
          isActive && "bg-gradient-to-t from-primary via-primary to-primary/80",
          !isActive && isPast && isPositive && "bg-green-500",
          !isActive && isPast && !isPositive && "bg-red-500",
          !isActive && !isPast && "bg-muted opacity-30"
        )}
      />
    </button>
  );
};

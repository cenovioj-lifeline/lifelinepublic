export interface MobileSuperlative {
  id: string;
  title: string;
  winner: {
    id: string;
    name: string;
    photo_url: string | null;
    position_x?: number;
    position_y?: number;
    scale?: number;
    initials: string;
    color: string;
    slug: string;
  };
  description: string;
  category: string;
  votes: number;
  percentage: number;
}

export interface MobileCategory {
  id: string;
  name: string;
  icon: string;
  superlatives: MobileSuperlative[];
  order: number;
}

const FALLBACK_COLORS = [
  'hsl(var(--primary))',
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(24, 95%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(340, 82%, 52%)',
];

const getCategoryIcon = (categoryName: string): string => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('most likely')) return '🎯';
  if (lower.includes('yearbook') || lower.includes('classic')) return '📚';
  if (lower.includes('best')) return '🏆';
  if (lower.includes('biggest')) return '⭐';
  return '✨';
};

const generateInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getColorForId = (id: string): string => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
};

export const transformElectionResults = (
  results: any[],
  categoryOrdering: Record<string, number>
): MobileCategory[] => {
  const grouped: Record<string, MobileCategory> = {};
  
  results.forEach(result => {
    const category = result.superlative_category || 'Other';
    if (!grouped[category]) {
      grouped[category] = {
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category,
        icon: getCategoryIcon(category),
        superlatives: [],
        order: categoryOrdering[category] ?? 999,
      };
    }

    const winnerProfile = result.profiles?.[0];
    
    grouped[category].superlatives.push({
      id: result.id,
      title: result.category || '',
      winner: {
        id: winnerProfile?.id || '',
        name: winnerProfile?.name || result.winner_name || 'Unknown',
        photo_url: winnerProfile?.avatar?.url || winnerProfile?.primary_image_url || null,
        position_x: winnerProfile?.avatar?.position_x,
        position_y: winnerProfile?.avatar?.position_y,
        scale: winnerProfile?.avatar?.scale,
        initials: generateInitials(winnerProfile?.name || result.winner_name || 'Unknown'),
        color: getColorForId(winnerProfile?.id || result.id),
        slug: winnerProfile?.slug || '',
      },
      description: result.notes || '',
      category: category,
      votes: result.vote_count || 0,
      percentage: result.percentage || 0,
    });
  });

  return Object.values(grouped).sort((a, b) => a.order - b.order);
};

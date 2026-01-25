interface ContentTypeBannerProps {
  type: "lifeline" | "profile" | "election" | "book" | "collection" | "link" | string;
  cardLabel?: string | null;
}

const labels: Record<string, string> = {
  lifeline: "Lifeline",
  profile: "Profile",
  election: "Awards",
  book: "Book",
  collection: "Collection",
  link: "Link",
};

export function ContentTypeBanner({ type, cardLabel }: ContentTypeBannerProps) {
  // Use custom card label if provided, otherwise fall back to type label
  const getBannerText = () => {
    if (cardLabel) {
      return cardLabel;
    }
    return labels[type] || type;
  };

  return (
    <div className="bg-white px-3 py-1.5 border-b border-gray-100">
      <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
        {getBannerText()}
      </span>
    </div>
  );
}

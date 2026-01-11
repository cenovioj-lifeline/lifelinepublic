interface ContentTypeBannerProps {
  type: "lifeline" | "profile" | "election" | "book" | "collection" | string;
  collectionSlug?: string;
}

const labels: Record<string, string> = {
  lifeline: "Lifeline",
  profile: "Profile",
  election: "Awards",
  book: "Book",
  collection: "Collection",
};

export function ContentTypeBanner({ type, collectionSlug }: ContentTypeBannerProps) {
  // Custom banner text for specific collections
  const getBannerText = () => {
    if (type === "collection" && collectionSlug === "the-lifeline-story") {
      return "Investor Tour / Sales Pitch";
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

interface ContentTypeBannerProps {
  type: "lifeline" | "profile" | "election" | "book" | "collection" | string;
}

const labels: Record<string, string> = {
  lifeline: "Lifeline",
  profile: "Profile",
  election: "Awards",
  book: "Book",
  collection: "Collection",
};

export function ContentTypeBanner({ type }: ContentTypeBannerProps) {
  return (
    <div className="bg-white px-3 py-1.5 border-b border-gray-100">
      <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
        {labels[type] || type}
      </span>
    </div>
  );
}

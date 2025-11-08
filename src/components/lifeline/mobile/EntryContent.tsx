interface EntryContentProps {
  date: string;
  description: string;
}

export const EntryContent = ({ date, description }: EntryContentProps) => {
  return (
    <div className="p-6 space-y-4">
      {date && (
        <span className="text-sm text-muted-foreground">{date}</span>
      )}
      
      <div className="prose prose-sm max-w-none text-foreground">
        {description.split('\n').map((paragraph, i) => (
          paragraph.trim() && <p key={i} className="mb-4">{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

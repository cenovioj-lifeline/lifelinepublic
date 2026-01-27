import { Star } from "lucide-react";

interface WaitingForIntentProps {
  onExampleClick?: (example: string) => void;
}

const examples = [
  "Create a new lifeline",
  "Add an entry",
  "Save a quote",
  "Add a video",
];

export function WaitingForIntent({ onExampleClick }: WaitingForIntentProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {/* Icon */}
      <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-5">
        <Star className="w-10 h-10 text-sky-500" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Help</h3>

      {/* Description */}
      <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed">
        Tell me what you'd like to create in the chat, and I'll show you a form here as I build it.
      </p>

      {/* Example chips */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Try saying
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => onExampleClick?.(example)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

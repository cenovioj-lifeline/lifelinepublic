import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, Plus } from "lucide-react";

interface EntryFormState {
  title: string;
  description: string;
  score: number;
  year: string;
}

interface EntryCardFormProps {
  form: EntryFormState;
  onChange: (form: EntryFormState) => void;
  onSave: () => void;
  onClear: () => void;
  saving: boolean;
  disabled?: boolean;
  isEditing?: boolean;
  aiFilledFields?: Set<string>;
  isAiMode?: boolean;
  lifelineTitle?: string;
}

export function EntryCardForm({
  form,
  onChange,
  onSave,
  onClear,
  saving,
  disabled = false,
  isEditing = false,
  aiFilledFields = new Set(),
  isAiMode = false,
  lifelineTitle,
}: EntryCardFormProps) {
  const getFieldClass = (fieldName: string) => {
    const baseClass = "w-full";
    const aiClass = isAiMode ? "border-sky-300 focus:border-sky-500" : "";
    const filledClass = aiFilledFields.has(fieldName) ? "bg-sky-50 border-sky-400" : "";
    return `${baseClass} ${aiClass} ${filledClass}`;
  };

  const formatScore = (score: number): string => {
    if (score > 0) return `+${score}`;
    return String(score);
  };

  const getScoreColor = (score: number): string => {
    if (score > 0) return "text-green-600";
    if (score < 0) return "text-red-600";
    return "text-gray-500";
  };

  const getScoreCircleColor = (score: number): string => {
    if (score > 0) return "bg-gradient-to-br from-green-500 to-green-600";
    if (score < 0) return "bg-gradient-to-br from-red-500 to-red-600";
    return "bg-gradient-to-br from-gray-400 to-gray-500";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Lifeline Context (if provided) */}
      {lifelineTitle && isAiMode && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border-b">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Adding to</div>
            <div className="text-sm font-semibold text-gray-900">{lifelineTitle}</div>
          </div>
        </div>
      )}

      {/* Entry Header with Score Circle */}
      <div className="flex gap-4 p-5 border-b border-gray-100">
        {/* Score Circle */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${getScoreCircleColor(form.score)}`}>
            {formatScore(form.score)}
          </div>
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Score</span>
        </div>

        {/* Title and Date */}
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wide mb-1">
              What happened?
            </label>
            <Input
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="Entry title"
              disabled={disabled}
              className={`${getFieldClass("entry_title")} font-semibold`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wide mb-1">
              When?
            </label>
            <Input
              value={form.year}
              onChange={(e) => onChange({ ...form, year: e.target.value })}
              placeholder="Year or date"
              disabled={disabled}
              className={getFieldClass("entry_year")}
            />
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-5 space-y-4">
        {/* Description */}
        <div>
          <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wide mb-1.5">
            Tell the story
          </label>
          <Textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="What made this moment meaningful?"
            rows={3}
            disabled={disabled}
            className={getFieldClass("entry_description")}
          />
        </div>

        {/* Score Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-semibold text-sky-700 uppercase tracking-wide">
              How did it feel?
            </label>
            <span className={`text-lg font-bold ${getScoreColor(form.score)}`}>
              {formatScore(form.score)}
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 top-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 0 }} />
            <Slider
              value={[form.score]}
              onValueChange={([v]) => onChange({ ...form, score: v })}
              min={-10}
              max={10}
              step={1}
              disabled={disabled}
              className="relative z-10"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={onSave}
          disabled={saving || !form.title || disabled}
          className="w-full bg-sky-500 hover:bg-sky-600"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Update Entry
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </>
          )}
        </Button>

        {/* Clear button (if form has data) */}
        {(form.title || form.description || isEditing) && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="w-full text-gray-500"
          >
            {isEditing ? "Cancel Edit" : "Clear Form"}
          </Button>
        )}
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Check } from "lucide-react";

interface LifelineFormState {
  title: string;
  lifeline_type: string;
  purpose: string;
}

interface LifelineCardFormProps {
  form: LifelineFormState;
  onChange: (form: LifelineFormState) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  aiFilledFields?: Set<string>;
  isAiMode?: boolean;
}

export function LifelineCardForm({
  form,
  onChange,
  onSave,
  saving,
  saved,
  aiFilledFields = new Set(),
  isAiMode = false,
}: LifelineCardFormProps) {
  const getFieldClass = (fieldName: string) => {
    const baseClass = "w-full";
    const aiClass = isAiMode ? "border-sky-300 focus:border-sky-500" : "";
    const filledClass = aiFilledFields.has(fieldName) ? "bg-sky-50 border-sky-400" : "";
    return `${baseClass} ${aiClass} ${filledClass}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Cover Image Upload Zone */}
      <div 
        className="aspect-video bg-linear-to-br from-sky-50 to-sky-100 border-2 border-dashed border-sky-300 flex flex-col items-center justify-center cursor-pointer hover:from-sky-100 hover:to-sky-200 hover:border-sky-400 transition-all relative"
      >
        {/* Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 rounded-md text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          Lifeline
        </span>

        {/* Upload Icon */}
        <div className="flex flex-col items-center">
          <ImageIcon className="w-10 h-10 text-sky-600 mb-2" strokeWidth={1.5} />
          <span className="text-sm font-medium text-sky-700">Add Cover Image</span>
          <span className="text-xs text-gray-500 mt-1">Drag & drop or click to upload</span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wide mb-1.5">
            Title
          </label>
          <Input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="e.g., Cars I Have Owned"
            disabled={saved}
            className={`${getFieldClass("title")} text-lg font-semibold`}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wide mb-1.5">
            Type
          </label>
          <Select
            value={form.lifeline_type}
            onValueChange={(v) => onChange({ ...form, lifeline_type: v })}
            disabled={saved}
          >
            <SelectTrigger className={getFieldClass("lifeline_type")}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List (collection of things)</SelectItem>
              <SelectItem value="person">Person (your journey)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-semibold text-sky-700 uppercase tracking-wide mb-1.5">
            Description
          </label>
          <Textarea
            value={form.purpose}
            onChange={(e) => onChange({ ...form, purpose: e.target.value })}
            placeholder="What is this lifeline about?"
            rows={3}
            disabled={saved}
            className={getFieldClass("purpose")}
          />
        </div>

        {/* Save Button */}
        {!saved && (
          <Button
            onClick={onSave}
            disabled={saving || !form.title}
            className="w-full bg-sky-500 hover:bg-sky-600"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Lifeline
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

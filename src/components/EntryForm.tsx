import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type EntryFormData = {
  title: string;
  occurred_on?: string;
  order_index: number;
  summary: string;
  details: string;
  score: number;
  tags?: string;
  related_lifelines?: string;
  media_suggestion?: string;
};

interface EntryFormProps {
  lifelineType: "person" | "list" | "voting";
  defaultValues?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function EntryForm({
  lifelineType,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
}: EntryFormProps) {
  const form = useForm<EntryFormData>({
    defaultValues: {
      title: "",
      summary: "",
      details: "",
      score: 0,
      order_index: 0,
      tags: "",
      related_lifelines: "",
      media_suggestion: "",
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: EntryFormData) => {
    // Auto-calculate sentiment based on score
    const sentiment = data.score > 0 ? "positive" : data.score < 0 ? "negative" : "neutral";
    onSubmit({ ...data, sentiment } as any);
  };

  const isListType = lifelineType === "list" || lifelineType === "voting";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Title *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Entry title" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isListType ? (
            <FormField
              control={form.control}
              name="order_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rank *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder="1, 2, 3..."
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="occurred_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {lifelineType !== "voting" && (
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={-10}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Positive scores = green (good events), Negative scores = red (challenges)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="2-3 sentences" rows={4} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="tag1|tag2|tag3" />
                </FormControl>
                <FormDescription>Pipe-separated tags</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="related_lifelines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Lifelines (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="lifeline-id-1|lifeline-id-2" />
                </FormControl>
                <FormDescription>Pipe-separated lifeline IDs</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="media_suggestion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Suggestion (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Suggest media for this entry" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
              ? "Update Entry"
              : "Save Entry"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {isEditing ? "Cancel" : "Clear Form"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

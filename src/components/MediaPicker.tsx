import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ImageIcon } from "lucide-react";

interface MediaPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
}

export function MediaPicker({
  value,
  onValueChange,
  placeholder = "Select an image",
  allowNone = true,
}: MediaPickerProps) {
  const { data: mediaAssets } = useQuery({
    queryKey: ["media-assets-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("id, filename, url, type")
        .eq("type", "image")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Select 
      onValueChange={(val) => onValueChange(val === "none" ? "" : val)} 
      value={value || "none"}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && value !== "none" ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={mediaAssets?.find(m => m.id === value)?.url} 
                  alt="Selected" 
                />
                <AvatarFallback>
                  <ImageIcon className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {mediaAssets?.find(m => m.id === value)?.filename || "Selected"}
              </span>
            </div>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background">
        {allowNone && <SelectItem value="none">None</SelectItem>}
        {mediaAssets?.map((media) => (
          <SelectItem key={media.id} value={media.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={media.url} alt={media.filename} />
                <AvatarFallback>
                  <ImageIcon className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{media.filename}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

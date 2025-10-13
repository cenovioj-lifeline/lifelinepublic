import { supabase } from "@/integrations/supabase/client";

export const uploadImage = async (
  file: File,
  bucket: string = "media-uploads"
): Promise<{ url: string; path: string }> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath,
  };
};

export const createMediaAsset = async (
  file: File,
  url: string,
  dimensions?: { width: number; height: number },
  position?: { x: number; y: number }
) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      filename: file.name,
      url,
      type: file.type.startsWith("image/") ? "image" : file.type.split("/")[0],
      alt_text: file.name.split(".")[0].replace(/-/g, " "),
      width: dimensions?.width || null,
      height: dimensions?.height || null,
      position_x: position?.x || 50,
      position_y: position?.y || 50,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

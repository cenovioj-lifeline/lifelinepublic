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

  // Clean trailing ? from URL if present (Supabase sometimes adds empty query string)
  let cleanUrl = data.publicUrl;
  if (cleanUrl.endsWith('?')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  return {
    url: cleanUrl,
    path: filePath,
  };
};

export const deleteImage = async (
  path: string,
  bucket: string = "media-uploads"
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
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

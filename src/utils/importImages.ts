import { supabase } from "@/integrations/supabase/client";

interface ImportImageParams {
  entryId: string;
  imageUrl: string;
  altText?: string;
  orderIndex?: number;
  position?: {
    x?: number;
    y?: number;
    scale?: number;
  };
}

export const importImageFromUrl = async (params: ImportImageParams) => {
  const { data, error } = await supabase.functions.invoke('import-image-from-url', {
    body: params
  });

  if (error) {
    console.error('Error importing image:', error);
    throw error;
  }

  return data;
};

export const importMultipleImages = async (images: ImportImageParams[]) => {
  const results = await Promise.allSettled(
    images.map(img => importImageFromUrl(img))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Imported ${successful} images successfully, ${failed} failed`);

  return { successful, failed, results };
};

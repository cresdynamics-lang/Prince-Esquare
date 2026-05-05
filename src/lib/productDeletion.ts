import type { SupabaseClient } from "@supabase/supabase-js";

const PRODUCT_IMAGES_BUCKET = "product-images";

function storagePathFromPublicUrl(imageUrl: string): string | null {
  if (!imageUrl) return null;
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) return null;
  const rawPath = imageUrl.slice(markerIndex + marker.length).split("?")[0];
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

export async function deleteProductCompletely(
  supabase: SupabaseClient<any, any, any>,
  productId: string,
) {
  const { data: imageRows, error: imageReadError } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("product_id", productId);

  if (imageReadError) return { error: imageReadError };

  const storagePaths = Array.from(
    new Set(
      (imageRows ?? [])
        .map((row: any) => storagePathFromPublicUrl(String(row.image_url ?? "")))
        .filter((path): path is string => Boolean(path)),
    ),
  );

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(storagePaths);
    if (storageError) return { error: storageError };
  }

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  return { error };
}

/**
 * Resize/compress images before upload — faster saves and smaller Cloudinary delivery.
 */
export async function compressImageFile(
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.78, skipBelowBytes = 250_000 } = {}
) {
  if (!file?.type?.startsWith('image/')) return file;
  if (file.size <= skipBelowBytes) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
  if (!blob || blob.size >= file.size) return file;

  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

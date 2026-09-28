import type { PropertyImage } from "@/types";

import { getSupabase, throwOnError } from "./client";
import { deleteFile, storageFolders, uploadFile } from "./storage";

const TABLE = "property_images";

export async function listPropertyImages(
  propertyId: string
): Promise<PropertyImage[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("is_primary", { ascending: false })
    .order("display_order", { ascending: true });

  throwOnError(error, "Loading images");
  return (data ?? []) as unknown as PropertyImage[];
}

/**
 * Uploads a file and records it against the property. The first image for a
 * property automatically becomes the primary one.
 */
export async function addPropertyImage(
  propertyId: string,
  file: File,
  altText?: string
): Promise<PropertyImage> {
  const supabase = getSupabase();
  const existing = await listPropertyImages(propertyId);
  const uploaded = await uploadFile(
    file,
    storageFolders.propertyImages(propertyId)
  );

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      property_id: propertyId,
      path: uploaded.path,
      url: uploaded.url,
      alt_text: altText?.trim() ? altText.trim() : null,
      is_primary: existing.length === 0,
      display_order: existing.length,
    })
    .select("*")
    .single();

  if (error) {
    // Do not leave an orphaned object behind if the insert failed.
    await deleteFile(uploaded.path);
    throwOnError(error, "Saving image");
  }

  return data as unknown as PropertyImage;
}

export async function updatePropertyImageAlt(
  id: string,
  altText: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ alt_text: altText.trim() ? altText.trim() : null })
    .eq("id", id);

  throwOnError(error, "Updating image");
}

export async function deletePropertyImage(
  image: PropertyImage
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", image.id);
  throwOnError(error, "Deleting image");

  await deleteFile(image.path);

  // Promote another image when the primary one was removed.
  if (image.is_primary) {
    const remaining = await listPropertyImages(image.property_id);
    if (remaining.length > 0) {
      await setPrimaryImage(image.property_id, remaining[0].id);
    }
  }
}

export async function setPrimaryImage(
  propertyId: string,
  imageId: string
): Promise<void> {
  const supabase = getSupabase();

  const { error: clearError } = await supabase
    .from(TABLE)
    .update({ is_primary: false })
    .eq("property_id", propertyId);

  throwOnError(clearError, "Updating primary image");

  const { error } = await supabase
    .from(TABLE)
    .update({ is_primary: true })
    .eq("id", imageId);

  throwOnError(error, "Updating primary image");
}

export async function reorderPropertyImages(ids: string[]): Promise<void> {
  const supabase = getSupabase();

  await Promise.all(
    ids.map(async (id, index) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ display_order: index })
        .eq("id", id);
      throwOnError(error, "Reordering images");
    })
  );
}

import type { PropertyImage } from "@/types";

import { getSupabase, throwOnError } from "./client";
import { deleteFile, storageFolders, uploadFile } from "./storage";

const TABLE = "property_images";

/**
 * Keeps the master `properties.cover_image` column pointing at the primary
 * gallery image, which is what the website uses for cards and hero thumbnails.
 */
async function syncCoverImage(propertyId: string): Promise<void> {
  const supabase = getSupabase();
  const images = await listPropertyImages(propertyId);
  const primary = images.find((image) => image.is_primary) ?? images[0] ?? null;

  const { error } = await supabase
    .from("properties")
    .update({ cover_image: primary?.url ?? null })
    .eq("id", propertyId);

  throwOnError(error, "Updating the cover image");
}

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

  if (existing.length === 0) await syncCoverImage(propertyId);

  return data as unknown as PropertyImage;
}

export async function updatePropertyImageAlt(
  id: string,
  altText: string
): Promise<void> {
  const trimmed = altText.trim();
  if (!trimmed) {
    throw new Error("Alt text is required for gallery images.");
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ alt_text: trimmed })
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
    } else {
      await syncCoverImage(image.property_id);
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
  await syncCoverImage(propertyId);
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

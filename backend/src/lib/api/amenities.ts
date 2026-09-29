import type { Amenity, LookupItem, PropertyAmenity } from "@/types";
import type { AmenityInput } from "@/lib/validations";

import { getSupabase, nullifyEmpty, throwOnError } from "./client";

const TABLE = "amenities";
const LINK_TABLE = "property_amenities";

export async function listAmenities(): Promise<Amenity[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("name", { ascending: true });

  throwOnError(error, "Loading amenities");
  return (data ?? []) as unknown as Amenity[];
}

export async function listActiveAmenities(): Promise<Amenity[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  throwOnError(error, "Loading amenities");
  return (data ?? []) as unknown as Amenity[];
}

export async function createAmenity(input: AmenityInput): Promise<Amenity> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(nullifyEmpty(input))
    .select("*")
    .single();

  throwOnError(error, "Creating amenity");
  return data as unknown as Amenity;
}

export async function updateAmenity(
  id: string,
  input: AmenityInput
): Promise<Amenity> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update(nullifyEmpty(input))
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating amenity");
  return data as unknown as Amenity;
}

export async function deleteAmenity(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  throwOnError(error, "Deleting amenity");
}

export async function setAmenityActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id);

  throwOnError(error, "Updating amenity");
}

export async function countPropertiesForAmenity(
  amenityId: string
): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from(LINK_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("amenity_id", amenityId);

  throwOnError(error, "Counting linked properties");
  return count ?? 0;
}

/**
 * Amenity links for one property, with catalog rows attached.
 * Prefers master `lookup_amenity_id`; falls back to legacy `amenity_id`.
 */
export async function listPropertyAmenities(
  propertyId: string
): Promise<PropertyAmenity[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(LINK_TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order", { ascending: true });

  throwOnError(error, "Loading property amenities");
  const links = (data ?? []) as unknown as PropertyAmenity[];
  if (links.length === 0) return [];

  const legacyIds = links
    .map((link) => link.amenity_id)
    .filter((id): id is string => Boolean(id));
  const lookupIds = links
    .map((link) => link.lookup_amenity_id)
    .filter((id): id is string => Boolean(id));

  const [legacyResult, lookupResult] = await Promise.all([
    legacyIds.length
      ? supabase.from(TABLE).select("*").in("id", legacyIds)
      : Promise.resolve({ data: [], error: null }),
    lookupIds.length
      ? supabase.from("lookup_amenities").select("*").in("id", lookupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwOnError(legacyResult.error, "Loading property amenities");
  throwOnError(lookupResult.error, "Loading property amenities");

  const legacyCatalog = new Map(
    ((legacyResult.data ?? []) as unknown as Amenity[]).map((row) => [
      row.id,
      row,
    ])
  );
  const lookupCatalog = new Map(
    ((lookupResult.data ?? []) as unknown as LookupItem[]).map((row) => [
      row.id,
      row,
    ])
  );

  return links.map((link) => ({
    ...link,
    amenity: link.amenity_id
      ? legacyCatalog.get(link.amenity_id)
      : undefined,
    lookup_amenity: link.lookup_amenity_id
      ? lookupCatalog.get(link.lookup_amenity_id)
      : undefined,
  }));
}

/**
 * Replaces amenity selection using master lookup_amenities ids.
 * Writes lookup_amenity_id; leaves amenity_id null.
 */
export async function setPropertyLookupAmenities(
  propertyId: string,
  lookupAmenityIds: string[]
): Promise<void> {
  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from(LINK_TABLE)
    .delete()
    .eq("property_id", propertyId);

  throwOnError(deleteError, "Updating property amenities");

  if (lookupAmenityIds.length === 0) return;

  const rows = lookupAmenityIds.map((amenityId, index) => ({
    property_id: propertyId,
    amenity_id: null,
    lookup_amenity_id: amenityId,
    display_order: index,
  }));

  const { error: insertError } = await supabase.from(LINK_TABLE).insert(rows);
  throwOnError(insertError, "Updating property amenities");
}

/**
 * @deprecated Prefer setPropertyLookupAmenities for master schema.
 * Replaces the amenity selection for a property in one pass (legacy catalog).
 */
export async function setPropertyAmenities(
  propertyId: string,
  amenityIds: string[]
): Promise<void> {
  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from(LINK_TABLE)
    .delete()
    .eq("property_id", propertyId);

  throwOnError(deleteError, "Updating property amenities");

  if (amenityIds.length === 0) return;

  const rows = amenityIds.map((amenityId, index) => ({
    property_id: propertyId,
    amenity_id: amenityId,
    lookup_amenity_id: null,
    display_order: index,
  }));

  const { error: insertError } = await supabase.from(LINK_TABLE).insert(rows);
  throwOnError(insertError, "Updating property amenities");
}

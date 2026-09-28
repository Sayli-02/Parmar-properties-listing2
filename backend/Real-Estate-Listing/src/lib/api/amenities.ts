import type { Amenity, PropertyAmenity } from "@/types";
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
 * Amenity links for one property, with the catalog row attached.
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

  const { data: amenityRows, error: amenityError } = await supabase
    .from(TABLE)
    .select("*")
    .in(
      "id",
      links.map((link) => link.amenity_id)
    );

  throwOnError(amenityError, "Loading property amenities");
  const catalog = new Map(
    ((amenityRows ?? []) as unknown as Amenity[]).map((row) => [row.id, row])
  );

  return links.map((link) => ({
    ...link,
    amenity: catalog.get(link.amenity_id),
  }));
}

/**
 * Replaces the amenity selection for a property in one pass.
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
    display_order: index,
  }));

  const { error: insertError } = await supabase.from(LINK_TABLE).insert(rows);
  throwOnError(insertError, "Updating property amenities");
}

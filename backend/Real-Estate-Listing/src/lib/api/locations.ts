import type { Location } from "@/types";
import type { LocationInput } from "@/lib/validations";

import { getSupabase, nullifyEmpty, throwOnError } from "./client";
import { deleteFile } from "./storage";

const TABLE = "locations";

export async function listLocations(): Promise<Location[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  throwOnError(error, "Loading locations");
  return (data ?? []) as unknown as Location[];
}

export async function listActiveLocations(): Promise<Location[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  throwOnError(error, "Loading locations");
  return (data ?? []) as unknown as Location[];
}

export async function getLocation(id: string): Promise<Location | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error, "Loading location");
  return (data as unknown as Location) ?? null;
}

export async function getNextLocationOrder(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  throwOnError(error, "Loading location order");
  const highest = (data?.[0]?.display_order as number | undefined) ?? -1;
  return highest + 1;
}

export async function createLocation(
  input: LocationInput,
  image?: { path: string; url: string } | null
): Promise<Location> {
  const supabase = getSupabase();
  const payload = {
    ...nullifyEmpty(input),
    image_path: image?.path ?? null,
    image_url: image?.url ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Creating location");
  return data as unknown as Location;
}

export async function updateLocation(
  id: string,
  input: LocationInput,
  image?: { path: string; url: string } | null
): Promise<Location> {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = nullifyEmpty(input);

  if (image !== undefined) {
    payload.image_path = image?.path ?? null;
    payload.image_url = image?.url ?? null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating location");
  return data as unknown as Location;
}

export async function deleteLocation(location: Location): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", location.id);

  throwOnError(error, "Deleting location");
  await deleteFile(location.image_path);
}

export async function setLocationActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id);

  throwOnError(error, "Updating location");
}

export async function countPropertiesForLocation(
  locationId: string
): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId)
    .is("deleted_at", null);

  throwOnError(error, "Counting properties");
  return count ?? 0;
}

export async function reorderLocations(ids: string[]): Promise<void> {
  const supabase = getSupabase();

  await Promise.all(
    ids.map(async (id, index) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ display_order: index })
        .eq("id", id);
      throwOnError(error, "Reordering locations");
    })
  );
}

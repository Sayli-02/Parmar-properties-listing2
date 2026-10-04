import type { Location } from "@/types";
import type { LocationInput } from "@/lib/validations";

import { getSupabase, nullifyEmpty, throwOnError } from "./client";
import { deleteFile } from "./storage";

const TABLE = "locations";
const MAX_HOME_PRIMARY = 4;

export async function listLocations(): Promise<Location[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
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
    .order("sort_order", { ascending: true })
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

export async function isLocationSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase();
  let query = supabase.from(TABLE).select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  throwOnError(error, "Checking the slug");
  return (data ?? []).length === 0;
}

export async function getNextLocationOrder(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  throwOnError(error, "Loading location order");
  const highest = (data?.[0]?.sort_order as number | undefined) ?? 0;
  return highest + 1;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

async function writeOrderPair(
  id: string,
  sortOrder: number
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({
      sort_order: sortOrder,
      display_order: sortOrder,
    })
    .eq("id", id);
  throwOnError(error, "Updating location order");
}

/**
 * Reassigns contiguous sort_order / display_order values 1..n for the given
 * id sequence. Used after inserts, moves, and deletes.
 */
export async function applyContiguousSortOrder(ids: string[]): Promise<void> {
  // Two-phase write avoids mid-swap collisions if a uniqueness constraint exists.
  await Promise.all(ids.map((id, index) => writeOrderPair(id, -(index + 1))));
  await Promise.all(ids.map((id, index) => writeOrderPair(id, index + 1)));
}

/**
 * Inserts `movingId` at 1-based `desiredOrder` among all locations and
 * renumbers everyone 1..n so duplicates are impossible.
 */
async function resequenceSortOrder(
  movingId: string | null,
  desiredOrder: number | null
): Promise<void> {
  const all = await listLocations();
  const others = movingId ? all.filter((l) => l.id !== movingId) : all;
  const ids = others.map((l) => l.id);

  if (movingId) {
    const target = clampInt(
      desiredOrder ?? ids.length + 1,
      1,
      ids.length + 1
    );
    ids.splice(target - 1, 0, movingId);
  }

  await applyContiguousSortOrder(ids);
}

/**
 * Maintains unique homepage primary_order values in 1..count (max 4).
 * Shifts peers when inserting/moving so two homepage locations never share
 * the same order.
 */
async function resequencePrimaryHomeOrder(
  movingId: string,
  isPrimaryHome: boolean,
  desiredOrder: number | null
): Promise<{ primary_order: number | null; is_primary_home: boolean }> {
  const all = await listLocations();
  let others = all
    .filter((l) => l.is_primary_home && l.id !== movingId)
    .sort(
      (a, b) =>
        (a.primary_order ?? Number.MAX_SAFE_INTEGER) -
        (b.primary_order ?? Number.MAX_SAFE_INTEGER)
    );

  if (!isPrimaryHome) {
    const supabase = getSupabase();
    const { error: clearError } = await supabase
      .from(TABLE)
      .update({ is_primary_home: false, primary_order: null })
      .eq("id", movingId);
    throwOnError(clearError, "Clearing homepage location");

    await Promise.all(
      others.map(async (loc, index) => {
        const { error } = await getSupabase()
          .from(TABLE)
          .update({
            is_primary_home: true,
            primary_order: index + 1,
          })
          .eq("id", loc.id);
        throwOnError(error, "Reordering homepage locations");
      })
    );

    return { is_primary_home: false, primary_order: null };
  }

  const alreadyPrimary = all.some(
    (l) => l.id === movingId && l.is_primary_home
  );
  if (!alreadyPrimary && others.length >= MAX_HOME_PRIMARY) {
    throw new Error(
      `At most ${MAX_HOME_PRIMARY} locations can be selected for the home page. Deselect another location first.`
    );
  }

  // Legacy data may have >4 homepage rows. Keep this location + earliest peers.
  if (others.length >= MAX_HOME_PRIMARY) {
    const keepPeers = others.slice(0, MAX_HOME_PRIMARY - 1);
    const dropPeers = others.slice(MAX_HOME_PRIMARY - 1);
    await Promise.all(
      dropPeers.map(async (loc) => {
        const { error } = await getSupabase()
          .from(TABLE)
          .update({ is_primary_home: false, primary_order: null })
          .eq("id", loc.id);
        throwOnError(error, "Trimming homepage locations");
      })
    );
    others = keepPeers;
  }

  const target = clampInt(
    desiredOrder ?? others.length + 1,
    1,
    others.length + 1
  );
  const orderedIds = others.map((l) => l.id);
  orderedIds.splice(target - 1, 0, movingId);

  await Promise.all(
    orderedIds.map(async (id, index) => {
      const { error } = await getSupabase()
        .from(TABLE)
        .update({
          is_primary_home: true,
          primary_order: index + 1,
        })
        .eq("id", id);
      throwOnError(error, "Updating homepage location order");
    })
  );

  return { is_primary_home: true, primary_order: target };
}

/**
 * Master columns from 006 are written alongside the legacy ones so the public
 * website and the existing Admin screens stay in step.
 */
function toLocationPayload(input: LocationInput): Record<string, unknown> {
  const payload = nullifyEmpty(input);

  payload.key_enclaves = input.key_enclaves ?? [];
  payload.is_active = input.publication_status === "published";
  // Ordering is applied transactionally after insert/update — strip here so
  // a raw write cannot leave duplicate sort/primary values behind.
  delete payload.sort_order;
  delete payload.display_order;
  delete payload.primary_order;
  delete payload.is_primary_home;

  return payload;
}

export async function createLocation(
  input: LocationInput,
  image?: { path: string; url: string } | null
): Promise<Location> {
  const supabase = getSupabase();
  const payload = {
    ...toLocationPayload(input),
    // Temporary placeholders; resequenced immediately after insert.
    sort_order: 0,
    display_order: 0,
    is_primary_home: false,
    primary_order: null,
    is_future: input.is_future,
    future_order: input.is_future ? (input.future_order ?? null) : null,
    image_path: image?.path ?? null,
    image_url: image?.url ?? null,
    cover_image: image?.url ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Creating location");
  const created = data as unknown as Location;

  await resequenceSortOrder(created.id, input.sort_order || null);
  await resequencePrimaryHomeOrder(
    created.id,
    Boolean(input.is_primary_home),
    input.primary_order ?? null
  );

  const refreshed = await getLocation(created.id);
  return refreshed ?? created;
}

export async function updateLocation(
  id: string,
  input: LocationInput,
  image?: { path: string; url: string } | null
): Promise<Location> {
  const supabase = getSupabase();
  const payload = toLocationPayload(input);
  payload.is_future = input.is_future;
  payload.future_order = input.is_future ? (input.future_order ?? null) : null;

  if (image !== undefined) {
    payload.image_path = image?.path ?? null;
    payload.image_url = image?.url ?? null;
    payload.cover_image = image?.url ?? null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating location");

  await resequenceSortOrder(id, input.sort_order ?? null);
  await resequencePrimaryHomeOrder(
    id,
    Boolean(input.is_primary_home),
    input.primary_order ?? null
  );

  const refreshed = await getLocation(id);
  return refreshed ?? (data as unknown as Location);
}

export async function deleteLocation(location: Location): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", location.id);

  throwOnError(error, "Deleting location");
  await deleteFile(location.image_path);

  // Keep general + homepage orders contiguous/unique after deletion.
  await resequenceSortOrder(null, null);
  const remainingPrimary = (await listLocations())
    .filter((l) => l.is_primary_home)
    .sort(
      (a, b) =>
        (a.primary_order ?? Number.MAX_SAFE_INTEGER) -
        (b.primary_order ?? Number.MAX_SAFE_INTEGER)
    );
  await Promise.all(
    remainingPrimary.map(async (loc, index) => {
      const { error: primaryError } = await getSupabase()
        .from(TABLE)
        .update({ primary_order: index + 1 })
        .eq("id", loc.id);
      throwOnError(primaryError, "Reordering homepage locations");
    })
  );
}

export async function setLocationActive(
  id: string,
  isActive: boolean
): Promise<Location> {
  const supabase = getSupabase();
  // Keep is_active + publication_status in lockstep — the public site gates on
  // both, and Admin treats the Live/Hidden switch as the single visibility control.
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_active: isActive,
      publication_status: isActive ? "published" : "draft",
    })
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating location");
  if (!data) {
    throw new Error(
      "Updating location failed: no row was updated. Check admin permissions."
    );
  }
  return data as unknown as Location;
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
  // Drag-and-drop order becomes the canonical public sort_order.
  await applyContiguousSortOrder(ids);
}

/**
 * One-time / maintenance repair: normalize sort_order to 1..n and homepage
 * primary_order to unique 1..k (max 4).
 */
export async function repairLocationOrdering(): Promise<void> {
  await resequenceSortOrder(null, null);

  const all = await listLocations();
  const primary = all
    .filter((l) => l.is_primary_home)
    .sort(
      (a, b) =>
        (a.primary_order ?? Number.MAX_SAFE_INTEGER) -
        (b.primary_order ?? Number.MAX_SAFE_INTEGER)
    );

  // Keep at most four; clear extras beyond the limit.
  const kept = primary.slice(0, MAX_HOME_PRIMARY);
  const dropped = primary.slice(MAX_HOME_PRIMARY);

  await Promise.all(
    dropped.map(async (loc) => {
      const { error } = await getSupabase()
        .from(TABLE)
        .update({ is_primary_home: false, primary_order: null })
        .eq("id", loc.id);
      throwOnError(error, "Repairing homepage locations");
    })
  );

  await Promise.all(
    kept.map(async (loc, index) => {
      const { error } = await getSupabase()
        .from(TABLE)
        .update({
          is_primary_home: true,
          primary_order: index + 1,
        })
        .eq("id", loc.id);
      throwOnError(error, "Repairing homepage location order");
    })
  );
}

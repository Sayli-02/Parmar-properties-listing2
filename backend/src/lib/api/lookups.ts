import type { LookupItem } from "@/types";

import { getSupabase, throwOnError } from "./client";

const LOOKUP_TABLES = [
  "lookup_locations",
  "lookup_bhk",
  "lookup_construction_status",
  "lookup_property_types",
  "lookup_commercial_types",
  "lookup_commercial_hubs",
  "lookup_commercial_grades",
  "lookup_amenities",
  "lookup_article_categories",
  "lookup_lead_sources",
  "lookup_lead_statuses",
] as const;

export type LookupTable = (typeof LOOKUP_TABLES)[number];

async function listLookup(
  table: LookupTable,
  activeOnly = true
): Promise<LookupItem[]> {
  const supabase = getSupabase();
  let query = supabase
    .from(table)
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  throwOnError(error, `Loading ${table.replace(/_/g, " ")}`);
  return (data ?? []) as unknown as LookupItem[];
}

export const listLookupLocations = (activeOnly = true) =>
  listLookup("lookup_locations", activeOnly);
export const listLookupBhk = (activeOnly = true) =>
  listLookup("lookup_bhk", activeOnly);
export const listLookupConstructionStatus = (activeOnly = true) =>
  listLookup("lookup_construction_status", activeOnly);
export const listLookupPropertyTypes = (activeOnly = true) =>
  listLookup("lookup_property_types", activeOnly);
export const listLookupAmenities = (activeOnly = true) =>
  listLookup("lookup_amenities", activeOnly);
export const listLookupCommercialTypes = (activeOnly = true) =>
  listLookup("lookup_commercial_types", activeOnly);
export const listLookupCommercialHubs = (activeOnly = true) =>
  listLookup("lookup_commercial_hubs", activeOnly);
export const listLookupCommercialGrades = (activeOnly = true) =>
  listLookup("lookup_commercial_grades", activeOnly);
export const listLookupArticleCategories = (activeOnly = true) =>
  listLookup("lookup_article_categories", activeOnly);

export async function createLookupItem(
  table: LookupTable,
  input: { slug: string; name: string; display_order?: number; is_active?: boolean }
): Promise<LookupItem> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .insert({
      slug: input.slug,
      name: input.name,
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  throwOnError(error, `Creating ${table.replace(/_/g, " ")}`);
  return data as unknown as LookupItem;
}

export async function updateLookupItem(
  table: LookupTable,
  id: string,
  input: { slug: string; name: string; display_order?: number; is_active?: boolean }
): Promise<LookupItem> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .update({
      slug: input.slug,
      name: input.name,
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, `Updating ${table.replace(/_/g, " ")}`);
  return data as unknown as LookupItem;
}

export async function setLookupItemActive(
  table: LookupTable,
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(table)
    .update({ is_active: isActive })
    .eq("id", id);

  throwOnError(error, `Updating ${table.replace(/_/g, " ")}`);
}

export async function deleteLookupItem(
  table: LookupTable,
  id: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(table).delete().eq("id", id);
  throwOnError(error, `Deleting ${table.replace(/_/g, " ")}`);
}

export async function listPropertyFormLookups() {
  const [locations, bhk, statuses, types, amenities, launchPhases] =
    await Promise.all([
      listLookupLocations(),
      listLookupBhk(),
      listLookupConstructionStatus(),
      listLookupPropertyTypes(),
      listLookupAmenities(),
      listLookupConstructionStatus(),
    ]);

  return {
    locations,
    bhk: bhk.filter((item) => item.slug !== "any"),
    statuses,
    types,
    amenities,
    launchPhases: launchPhases.filter((item) =>
      ["pre-launch", "under-construction"].includes(item.slug)
    ),
  };
}

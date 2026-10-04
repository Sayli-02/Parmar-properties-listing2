import type {
  Configuration,
  FloorPlan,
  InventoryUnit,
  Location,
  PaginatedResult,
  Property,
  PropertyConfiguration,
  PropertyFilters,
  PropertyImage,
  PropertyType,
  PropertyWithRelations,
} from "@/types";
import type { MasterPropertyInput, PropertyInput } from "@/lib/validations";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import {
  getSupabase,
  nullifyEmpty,
  sanitizeSearch,
  throwOnError,
} from "./client";
import { deleteFiles } from "./storage";
import {
  listPropertyAmenities,
  setPropertyAmenities,
  setPropertyLookupAmenities,
} from "./amenities";
import { listPropertyConfigurations } from "./property-configurations";

const TABLE = "properties";

/** Luxury Collection threshold in ₹ Cr (MASTER_BACKEND_SPEC). */
export const LUXURY_PRICE_THRESHOLD_CR = 25;

/**
 * Canonical lookup_bhk.slug → legacy properties.bhk text.
 * Used so admin filters (ilike on `bhk`) stay aligned with bhk_id.
 */
export const LEGACY_BHK_BY_LOOKUP_SLUG: Readonly<Record<string, string>> = {
  "1-bhk": "1 BHK",
  "2-bhk": "2 BHK",
  "3-bhk": "3 BHK",
  "4-bhk": "4 BHK",
  "5-bhk": "5 BHK",
  "6-plus-bhk": "6+ BHK",
  any: "Any",
};

/**
 * Canonical lookup_property_types.slug → legacy properties.property_type enum.
 * Explicit only — never infer or cast unknown slugs into the enum.
 */
export const LEGACY_PROPERTY_TYPE_BY_LOOKUP_SLUG: Readonly<
  Record<string, PropertyType>
> = {
  "sea-facing-apartment": "apartment",
  penthouse: "penthouse",
  "sky-villa": "villa",
  duplex: "duplex",
  "luxury-estate": "other",
};

export function legacyBhkFromLookupSlug(
  slug: string | null | undefined
): string | null {
  if (!slug) return null;
  return LEGACY_BHK_BY_LOOKUP_SLUG[slug] ?? null;
}

export function legacyPropertyTypeFromLookupSlug(
  slug: string | null | undefined
): PropertyType | null {
  if (!slug) return null;
  return LEGACY_PROPERTY_TYPE_BY_LOOKUP_SLUG[slug] ?? null;
}

async function fetchLookupSlug(
  table: "lookup_bhk" | "lookup_property_types",
  id: string | null | undefined
): Promise<string | null> {
  if (!id) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error, `Resolving ${table.replace(/_/g, " ")}`);
  const slug = (data as { slug?: string } | null)?.slug;
  return typeof slug === "string" && slug.length > 0 ? slug : null;
}

/**
 * Resolves canonical lookup IDs to legacy compatibility column values.
 * Returns only safely mapped values (never invents enum/text).
 *
 * - `bhk`: mapped label, or `null` when bhk_id is unset (clear legacy).
 *   `undefined` when bhk_id is set but slug is unknown (do not overwrite).
 * - `property_type`: mapped enum, or `undefined` when unset/unknown
 *   (omit from payload; insert uses DB default).
 */
export async function resolveLegacyBhkAndPropertyType(input: {
  bhk_id?: string | null;
  property_type_id?: string | null;
}): Promise<{
  bhk: string | null | undefined;
  property_type: PropertyType | undefined;
}> {
  const bhkId =
    input.bhk_id && String(input.bhk_id).trim() !== ""
      ? String(input.bhk_id)
      : null;
  const propertyTypeId =
    input.property_type_id && String(input.property_type_id).trim() !== ""
      ? String(input.property_type_id)
      : null;

  const [bhkSlug, propertyTypeSlug] = await Promise.all([
    fetchLookupSlug("lookup_bhk", bhkId),
    fetchLookupSlug("lookup_property_types", propertyTypeId),
  ]);

  let bhk: string | null | undefined;
  if (!bhkId) {
    bhk = null;
  } else {
    const mapped = legacyBhkFromLookupSlug(bhkSlug);
    bhk = mapped ?? undefined;
  }

  return {
    bhk,
    property_type:
      legacyPropertyTypeFromLookupSlug(propertyTypeSlug) ?? undefined,
  };
}

export function propertyDisplayTitle(property: Property): string {
  return property.title?.trim() || property.name;
}
export interface PropertyMediaFile {
  path: string;
  url: string;
}

function applySort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sort: PropertyFilters["sort"]
) {
  switch (sort) {
    case "newest":
      return query.order("created_at", { ascending: false });
    case "oldest":
      return query.order("created_at", { ascending: true });
    case "name":
      return query.order("name", { ascending: true });
    case "price":
      return query.order("price", {
        ascending: false,
        nullsFirst: false,
      });
    case "updated":
    default:
      return query.order("updated_at", { ascending: false });
  }
}

/**
 * Paginated, filtered property list. Each row carries its primary image so the
 * table can show a thumbnail without a second round trip per row.
 */
export async function listProperties(
  filters: PropertyFilters = {},
  options: { deleted?: boolean } = {}
): Promise<PaginatedResult<PropertyWithRelations>> {
  const supabase = getSupabase();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(TABLE).select("*", { count: "exact" });

  query = options.deleted
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      [
        `title.ilike.%${search}%`,
        `name.ilike.%${search}%`,
        `slug.ilike.%${search}%`,
        `sub_location.ilike.%${search}%`,
        `locality.ilike.%${search}%`,
        `city.ilike.%${search}%`,
        `rera_id.ilike.%${search}%`,
        `developer_name.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.publication_status)
    query = query.eq("publication_status", filters.publication_status);
  if (filters.property_type)
    query = query.eq("property_type", filters.property_type);
  if (filters.availability)
    query = query.eq("availability", filters.availability);
  if (filters.bhk) query = query.ilike("bhk", `%${filters.bhk}%`);
  if (filters.featured === "true") query = query.eq("is_featured", true);
  if (filters.featured === "false") query = query.eq("is_featured", false);

  if (filters.collection === "new-launches") {
    query = query.eq("is_new_launch", true);
  } else if (filters.collection === "luxury") {
    query = query.or(
      `is_luxury_collection.eq.true,price.gte.${LUXURY_PRICE_THRESHOLD_CR}`
    );
  }
  // "buy" = all non-deleted properties (no extra filter)

  query = applySort(query, filters.sort);

  const { data, error, count } = await query.range(from, to);
  throwOnError(error, "Loading properties");

  const properties = (data ?? []) as unknown as Property[];
  const total = count ?? 0;

  const withImages = await attachPrimaryImages(properties);

  return {
    data: withImages,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function attachPrimaryImages(
  properties: Property[]
): Promise<PropertyWithRelations[]> {
  if (properties.length === 0) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .in(
      "property_id",
      properties.map((p) => p.id)
    )
    .order("is_primary", { ascending: false })
    .order("display_order", { ascending: true });

  throwOnError(error, "Loading property images");
  const images = (data ?? []) as unknown as PropertyImage[];

  const byProperty = new Map<string, PropertyImage>();
  for (const image of images) {
    if (!byProperty.has(image.property_id)) {
      byProperty.set(image.property_id, image);
    }
  }

  return properties.map((property) => {
    const primary = byProperty.get(property.id);
    return { ...property, images: primary ? [primary] : [] };
  });
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error, "Loading property");
  return (data as unknown as Property) ?? null;
}

/**
 * Property plus every child collection, loaded in parallel.
 */
export async function getPropertyWithRelations(
  id: string
): Promise<PropertyWithRelations | null> {
  const supabase = getSupabase();
  const property = await getProperty(id);
  if (!property) return null;

  const [images, configurations, floorPlans, inventory, amenities, propertyConfigs] =
    await Promise.all([
      supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id)
        .order("is_primary", { ascending: false })
        .order("display_order", { ascending: true }),
      supabase
        .from("configurations")
        .select("*")
        .eq("property_id", id)
        .order("display_order", { ascending: true }),
      supabase
        .from("floor_plans")
        .select("*")
        .eq("property_id", id)
        .order("display_order", { ascending: true }),
      supabase
        .from("inventory_units")
        .select("*")
        .eq("property_id", id)
        .order("unit_number", { ascending: true }),
      listPropertyAmenities(id),
      listPropertyConfigurations(id),
    ]);

  throwOnError(images.error, "Loading property images");
  throwOnError(configurations.error, "Loading configurations");
  throwOnError(floorPlans.error, "Loading floor plans");
  throwOnError(inventory.error, "Loading inventory");

  let location: Location | null = null;
  if (property.location_id) {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("id", property.location_id)
      .maybeSingle();
    location = (data as unknown as Location) ?? null;
  }

  return {
    ...property,
    images: (images.data ?? []) as unknown as PropertyImage[],
    configurations: (configurations.data ?? []) as unknown as Configuration[],
    property_configurations: propertyConfigs as PropertyConfiguration[],
    floor_plans: (floorPlans.data ?? []) as unknown as FloorPlan[],
    inventory_units: (inventory.data ?? []) as unknown as InventoryUnit[],
    property_amenities: amenities,
    location,
  };
}

export async function isSlugAvailable(
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

async function getNextFeaturedOrder(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("featured_order")
    .eq("is_featured", true)
    .order("featured_order", { ascending: false, nullsFirst: false })
    .limit(1);

  throwOnError(error, "Loading featured order");
  const highest = (data?.[0]?.featured_order as number | null) ?? -1;
  return (highest ?? -1) + 1;
}

function toPropertyPayload(input: PropertyInput): Record<string, unknown> {
  const payload = nullifyEmpty(input);

  // `location_id` must be a real uuid or NULL — never an empty string.
  if (!payload.location_id) payload.location_id = null;

  return payload;
}

/**
 * Builds insert/update payload for the master property form.
 * Dual-writes legacy columns so existing Admin screens keep working.
 * Canonical SoT remains bhk_id / property_type_id; legacy bhk / property_type
 * are derived from lookup slugs via an explicit compatibility map.
 */
async function toMasterPropertyPayload(
  input: MasterPropertyInput
): Promise<Record<string, unknown>> {
  const locationId =
    input.location_id && input.location_id !== "" ? input.location_id : null;

  // Blank optional numbers stay NULL (DB allows null; CHECK rejects 0/NaN).
  const priceCr =
    input.price == null || Number.isNaN(Number(input.price))
      ? null
      : Number(input.price);
  const carpetSqft =
    input.carpet_area_sqft == null ||
    Number.isNaN(Number(input.carpet_area_sqft))
      ? null
      : Number(input.carpet_area_sqft);
  const superArea =
    input.super_area == null || Number.isNaN(Number(input.super_area))
      ? null
      : Number(input.super_area);

  const developerName =
    input.developer_name && String(input.developer_name).trim()
      ? String(input.developer_name).trim()
      : null;
  const developerDescription =
    input.developer_description && String(input.developer_description).trim()
      ? String(input.developer_description).trim()
      : null;

  const bhkId = input.bhk_id && input.bhk_id !== "" ? input.bhk_id : null;
  const { bhk: legacyBhk, property_type: legacyPropertyType } =
    await resolveLegacyBhkAndPropertyType({
      bhk_id: bhkId,
      property_type_id: input.property_type_id,
    });

  const payload: Record<string, unknown> = {
    // Master
    title: input.title,
    slug: input.slug,
    tagline: input.tagline,
    description: input.description,
    // Legacy Project Overview column — keep in sync with master description.
    project_overview: input.description,
    highlights: input.highlights,
    developer_name: developerName,
    developer_description: developerDescription,
    lookup_location_id: input.lookup_location_id,
    sub_location: input.sub_location,
    property_type_id: input.property_type_id,
    bhk_id: bhkId,
    status_id: input.status_id,
    price: priceCr,
    carpet_area_sqft: carpetSqft,
    super_area: superArea,
    possession_date: input.possession_date,
    floor:
      input.floor && String(input.floor).trim()
        ? String(input.floor).trim()
        : null,
    is_featured: input.is_featured,
    recently_added: input.recently_added,
    is_recommended: input.is_recommended,
    is_new_launch: input.is_new_launch,
    is_luxury_collection: input.is_luxury_collection,
    rera_id: input.rera_id,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    publication_status: input.publication_status,
    sort_order: input.sort_order,
    meta_title: input.meta_title || null,
    meta_description: input.meta_description || null,
    location_id: locationId,

    // Legacy dual-write
    name: input.title,
    locality: input.sub_location,
    location_details: input.sub_location,
    possession: input.possession_date,
    carpet_area: carpetSqft == null ? null : String(carpetSqft),
    price_amount: priceCr == null ? null : priceCr * 10_000_000,
    price_display: priceCr == null ? null : `₹${priceCr.toFixed(2)} Cr`,
    rera_number: input.rera_id,
    is_active: input.publication_status === "published",
    status:
      input.publication_status === "draft"
        ? "inactive"
        : input.is_new_launch
          ? "under_construction"
          : "active",
  };

  // Sync legacy BHK from canonical bhk_id. Clear when unset; skip unknown slugs.
  if (legacyBhk !== undefined) {
    payload.bhk = legacyBhk;
  }

  // Only write legacy enum when mapping succeeds — never invent invalid values.
  // On insert, omitting falls back to DB default 'apartment'.
  if (legacyPropertyType !== undefined) {
    payload.property_type = legacyPropertyType;
  }

  return payload;
}

export async function createProperty(
  input: PropertyInput
): Promise<Property> {
  const supabase = getSupabase();
  const payload = toPropertyPayload(input);

  if (input.is_featured) {
    payload.featured_order = await getNextFeaturedOrder();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Creating property");
  return data as unknown as Property;
}

export async function createMasterProperty(
  input: MasterPropertyInput
): Promise<Property> {
  const supabase = getSupabase();
  const payload = await toMasterPropertyPayload(input);

  if (input.is_featured) {
    payload.featured_order = await getNextFeaturedOrder();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Creating property");
  return data as unknown as Property;
}

export async function updateProperty(
  id: string,
  input: PropertyInput
): Promise<Property> {
  const supabase = getSupabase();
  const payload = toPropertyPayload(input);
  const current = await getProperty(id);

  if (input.is_featured && !current?.is_featured) {
    payload.featured_order = await getNextFeaturedOrder();
  }
  if (!input.is_featured) {
    payload.featured_order = null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating property");
  return data as unknown as Property;
}

export async function updateMasterProperty(
  id: string,
  input: MasterPropertyInput
): Promise<Property> {
  const supabase = getSupabase();
  const payload = await toMasterPropertyPayload(input);
  const current = await getProperty(id);

  if (input.is_featured && !current?.is_featured) {
    payload.featured_order = await getNextFeaturedOrder();
  }
  if (!input.is_featured) {
    payload.featured_order = null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating property");
  return data as unknown as Property;
}

/**
 * Saves the brochure / RERA QR file columns. Pass null to clear one.
 */
export async function updatePropertyMedia(
  id: string,
  media: {
    brochure?: PropertyMediaFile | null;
    reraQr?: PropertyMediaFile | null;
    coverImage?: string | null;
  }
): Promise<void> {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {};

  if (media.brochure !== undefined) {
    payload.brochure_path = media.brochure?.path ?? null;
    payload.brochure_url = media.brochure?.url ?? null;
  }
  if (media.reraQr !== undefined) {
    payload.rera_qr_path = media.reraQr?.path ?? null;
    payload.rera_qr_url = media.reraQr?.url ?? null;
    payload.rera_qr_image = media.reraQr?.url ?? null;
  }
  if (media.coverImage !== undefined) {
    payload.cover_image = media.coverImage;
  }
  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from(TABLE).update(payload).eq("id", id);
  throwOnError(error, "Updating property files");
}

export async function setPropertyActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({
      is_active: isActive,
      publication_status: isActive ? "published" : "draft",
    })
    .eq("id", id);

  throwOnError(error, "Updating property");
}

export async function setPropertyFeatured(
  id: string,
  isFeatured: boolean
): Promise<void> {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = { is_featured: isFeatured };
  payload.featured_order = isFeatured ? await getNextFeaturedOrder() : null;

  const { error } = await supabase.from(TABLE).update(payload).eq("id", id);
  throwOnError(error, "Updating featured status");
}

export async function reorderFeaturedProperties(ids: string[]): Promise<void> {
  const supabase = getSupabase();

  await Promise.all(
    ids.map(async (id, index) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ featured_order: index })
        .eq("id", id);
      throwOnError(error, "Reordering featured properties");
    })
  );
}

/**
 * Soft delete — the row stays for auditing and can be restored.
 */
export async function softDeleteProperty(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      is_featured: false,
      featured_order: null,
      publication_status: "archived",
    })
    .eq("id", id);

  throwOnError(error, "Deleting property");
}

/**
 * Restores as hidden: the listing comes back as a draft, never straight live.
 */
export async function restoreProperty(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ deleted_at: null, publication_status: "draft" })
    .eq("id", id);

  throwOnError(error, "Restoring property");
}

/**
 * Hard delete. Child rows cascade in the database; the uploaded files have to
 * be removed from storage here.
 */
export async function purgeProperty(id: string): Promise<void> {
  const supabase = getSupabase();
  const property = await getProperty(id);

  const [images, floorPlans] = await Promise.all([
    supabase.from("property_images").select("path").eq("property_id", id),
    supabase
      .from("floor_plans")
      .select("image_path, file_path")
      .eq("property_id", id),
  ]);

  const paths: (string | null | undefined)[] = [
    property?.brochure_path,
    property?.rera_qr_path,
    ...((images.data ?? []) as { path?: string | null }[]).map((r) => r.path),
    ...((floorPlans.data ?? []) as {
      image_path?: string | null;
      file_path?: string | null;
    }[]).flatMap((r) => [r.image_path, r.file_path]),
  ];

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  throwOnError(error, "Permanently deleting property");

  await deleteFiles(paths);
}

/**
 * Copies a property along with legacy configurations/price breakdowns,
 * master property_configurations + property_configuration_price_breakdowns,
 * floor plan records, and amenity links. Gallery/brochure/RERA files and
 * inventory units are not copied. Floor-plan image/file storage paths and
 * master configuration layout `image_path` values are cleared on the copy
 * so both rows do not share the same storage object (no safe storage-copy
 * helper exists for these assets).
 */
export async function duplicateProperty(id: string): Promise<Property> {
  const supabase = getSupabase();
  const source = await getPropertyWithRelations(id);
  if (!source) throw new Error("That property no longer exists.");

  const suffix = Date.now().toString(36).slice(-4);
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    created_by: _createdBy,
    updated_by: _updatedBy,
    deleted_at: _deletedAt,
    images: _images,
    configurations: _configurations,
    property_configurations: _layouts,
    floor_plans: _floorPlans,
    inventory_units: _inventoryUnits,
    property_amenities: _propertyAmenities,
    location: _location,
    ...rest
  } = source;

  const copyTitle = `${propertyDisplayTitle(source)} (Copy)`;

  const payload: Record<string, unknown> = {
    ...rest,
    name: copyTitle,
    title: copyTitle,
    slug: `${source.slug}-copy-${suffix}`,
    is_featured: false,
    featured_order: null,
    is_active: false,
    status: "inactive",
    publication_status: "draft",
    recently_added: false,
    brochure_path: null,
    brochure_url: null,
    rera_qr_path: null,
    rera_qr_url: null,
    rera_qr_image: null,
    // Images are not copied, so the copy starts without a cover.
    cover_image: null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Duplicating property");
  const copy = data as unknown as Property;

  // Configurations, keeping a map from old id to new id for price breakdowns.
  const configurationIdMap = new Map<string, string>();
  for (const configuration of source.configurations ?? []) {
    const {
      id: oldId,
      property_id: _propertyId,
      created_at: _cCreated,
      updated_at: _cUpdated,
      created_by: _cCreatedBy,
      updated_by: _cUpdatedBy,
      ...configRest
    } = configuration;

    const { data: newConfig, error: configError } = await supabase
      .from("configurations")
      .insert({ ...configRest, property_id: copy.id })
      .select("id")
      .single();

    throwOnError(configError, "Duplicating configurations");
    const newId = (newConfig as { id?: string } | null)?.id;
    if (newId) configurationIdMap.set(oldId, newId);
  }

  // Price breakdowns for each copied configuration.
  for (const [oldConfigId, newConfigId] of configurationIdMap) {
    const { data: breakdowns } = await supabase
      .from("price_breakdowns")
      .select("label, amount, display_order")
      .eq("configuration_id", oldConfigId);

    const rows = (breakdowns ?? []) as Record<string, unknown>[];
    if (rows.length > 0) {
      const { error: breakdownError } = await supabase
        .from("price_breakdowns")
        .insert(
          rows.map((row) => ({ ...row, configuration_id: newConfigId }))
        );
      throwOnError(breakdownError, "Duplicating price breakdowns");
    }
  }

  // Floor plans are property-level (master_plan / floor_plan); no config FK.
  for (const plan of source.floor_plans ?? []) {
    const {
      id: _planId,
      property_id: _planProperty,
      created_at: _pCreated,
      updated_at: _pUpdated,
      created_by: _pCreatedBy,
      updated_by: _pUpdatedBy,
      image_path: _planImagePath,
      file_path: _planFilePath,
      ...planRest
    } = plan;

    const { error: planError } = await supabase.from("floor_plans").insert({
      ...planRest,
      image_path: null,
      file_path: null,
      property_id: copy.id,
    });
    throwOnError(planError, "Duplicating floor plans");
  }

  // Master configuration matrix: remap IDs so price-breakdown lines can follow.
  const propertyConfigurationIdMap = new Map<string, string>();
  for (const layout of source.property_configurations ?? []) {
    const { data: newLayout, error: layoutError } = await supabase
      .from("property_configurations")
      .insert({
        property_id: copy.id,
        plan_type: layout.plan_type,
        variant_code: layout.variant_code,
        tab_label: layout.tab_label,
        title: layout.title,
        area_range: layout.area_range,
        carpet_area: layout.carpet_area,
        price_indicator: layout.price_indicator,
        tower_zone: layout.tower_zone,
        // Do not reuse the source layout storage path — there is no safe
        // storage-copy helper; empty string matches NOT NULL DEFAULT '' and
        // the create-path convention (admin re-uploads on the copy).
        image_path: "",
        display_order: layout.display_order,
      })
      .select("id")
      .single();

    throwOnError(layoutError, "Duplicating layouts");
    const newLayoutId = (newLayout as { id?: string } | null)?.id;
    if (newLayoutId) {
      propertyConfigurationIdMap.set(layout.id, newLayoutId);
    }
  }

  // Master price breakdowns for each copied property_configuration.
  for (const [oldLayoutId, newLayoutId] of propertyConfigurationIdMap) {
    const { data: breakdowns, error: loadBreakdownError } = await supabase
      .from("property_configuration_price_breakdowns")
      .select("label, amount, display_order")
      .eq("configuration_id", oldLayoutId)
      .order("display_order", { ascending: true });

    throwOnError(loadBreakdownError, "Loading configuration price breakdowns");

    const rows = (breakdowns ?? []) as Array<{
      label: string;
      amount: number;
      display_order: number;
    }>;
    if (rows.length === 0) continue;

    const { error: breakdownError } = await supabase
      .from("property_configuration_price_breakdowns")
      .insert(
        rows.map((row) => ({
          configuration_id: newLayoutId,
          label: row.label,
          amount: row.amount,
          display_order: row.display_order,
        }))
      );
    throwOnError(breakdownError, "Duplicating configuration price breakdowns");
  }

  const links = source.property_amenities ?? [];
  const lookupAmenityIds = links
    .map((link) => link.lookup_amenity_id)
    .filter((id): id is string => Boolean(id));
  const legacyAmenityIds = links
    .map((link) => link.amenity_id)
    .filter((id): id is string => Boolean(id));

  if (lookupAmenityIds.length > 0) {
    await setPropertyLookupAmenities(copy.id, lookupAmenityIds);
  } else if (legacyAmenityIds.length > 0) {
    await setPropertyAmenities(copy.id, legacyAmenityIds);
  }

  return copy;
}

/**
 * Lightweight list for pickers and cross-links.
 */
export async function listPropertyOptions(): Promise<
  Pick<Property, "id" | "name" | "slug">[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, slug")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  throwOnError(error, "Loading properties");
  return (data ?? []) as unknown as Pick<Property, "id" | "name" | "slug">[];
}

export async function listFeaturedProperties(): Promise<Property[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_featured", true)
    .is("deleted_at", null)
    .order("featured_order", { ascending: true, nullsFirst: false });

  throwOnError(error, "Loading featured properties");
  return (data ?? []) as unknown as Property[];
}

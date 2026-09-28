import type {
  Configuration,
  FloorPlan,
  InventoryUnit,
  Location,
  PaginatedResult,
  Property,
  PropertyFilters,
  PropertyImage,
  PropertyWithRelations,
} from "@/types";
import type { PropertyInput } from "@/lib/validations";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import {
  getSupabase,
  nullifyEmpty,
  sanitizeSearch,
  throwOnError,
} from "./client";
import { deleteFiles } from "./storage";
import { listPropertyAmenities, setPropertyAmenities } from "./amenities";

const TABLE = "properties";

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
      return query.order("price_amount", {
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
        `name.ilike.%${search}%`,
        `slug.ilike.%${search}%`,
        `locality.ilike.%${search}%`,
        `city.ilike.%${search}%`,
        `developer_name.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.property_type)
    query = query.eq("property_type", filters.property_type);
  if (filters.availability)
    query = query.eq("availability", filters.availability);
  if (filters.bhk) query = query.ilike("bhk", `%${filters.bhk}%`);
  if (filters.featured === "true") query = query.eq("is_featured", true);
  if (filters.featured === "false") query = query.eq("is_featured", false);

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

  const [images, configurations, floorPlans, inventory, amenities] =
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

/**
 * Saves the brochure / RERA QR file columns. Pass null to clear one.
 */
export async function updatePropertyMedia(
  id: string,
  media: {
    brochure?: PropertyMediaFile | null;
    reraQr?: PropertyMediaFile | null;
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
    .update({ is_active: isActive })
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
    })
    .eq("id", id);

  throwOnError(error, "Deleting property");
}

export async function restoreProperty(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ deleted_at: null })
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
 * Copies a property along with its configurations, price breakdowns, floor
 * plan records and amenity links. Images are not copied because both rows
 * would then point at the same storage object.
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
    floor_plans: _floorPlans,
    inventory_units: _inventoryUnits,
    property_amenities: _propertyAmenities,
    location: _location,
    ...rest
  } = source;

  const payload: Record<string, unknown> = {
    ...rest,
    name: `${source.name} (Copy)`,
    slug: `${source.slug}-copy-${suffix}`,
    is_featured: false,
    featured_order: null,
    is_active: false,
    status: "inactive",
    brochure_path: null,
    brochure_url: null,
    rera_qr_path: null,
    rera_qr_url: null,
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

  // Floor plans reference the same artwork URL but belong to the new property.
  for (const plan of source.floor_plans ?? []) {
    const {
      id: _planId,
      property_id: _planProperty,
      configuration_id: planConfigId,
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
      configuration_id: planConfigId
        ? configurationIdMap.get(planConfigId) ?? null
        : null,
    });
    throwOnError(planError, "Duplicating floor plans");
  }

  const amenityIds = (source.property_amenities ?? []).map(
    (link) => link.amenity_id
  );
  if (amenityIds.length > 0) {
    await setPropertyAmenities(copy.id, amenityIds);
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

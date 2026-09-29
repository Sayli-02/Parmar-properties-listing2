import type { PropertyConfiguration } from "@/types";
import type { PropertyConfigurationInput } from "@/lib/validations";

import { getSupabase, throwOnError } from "./client";

const TABLE = "property_configurations";

/**
 * Every text column on this table is NOT NULL with an empty-string default, so
 * blanks are written as `""` rather than nulled out.
 */
function toPayload(input: PropertyConfigurationInput): Record<string, unknown> {
  return {
    plan_type: input.plan_type,
    variant_code: input.variant_code,
    tab_label: input.tab_label,
    title: input.title,
    area_range: input.area_range ?? "",
    carpet_area: input.carpet_area ?? "",
    price_indicator: input.price_indicator ?? "",
    tower_zone: input.tower_zone ?? "",
    image_path: input.image_path ?? "",
    display_order: input.display_order ?? 0,
  };
}

export async function listPropertyConfigurations(
  propertyId: string
): Promise<PropertyConfiguration[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order", { ascending: true });

  throwOnError(error, "Loading property configurations");
  return (data ?? []) as unknown as PropertyConfiguration[];
}

export async function getNextPropertyConfigurationOrder(
  propertyId: string
): Promise<number> {
  const rows = await listPropertyConfigurations(propertyId);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((row) => row.display_order)) + 1;
}

export async function createPropertyConfiguration(
  propertyId: string,
  input: PropertyConfigurationInput
): Promise<PropertyConfiguration> {
  const supabase = getSupabase();
  const payload = {
    property_id: propertyId,
    ...toPayload(input),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Creating configuration");
  return data as unknown as PropertyConfiguration;
}

export async function updatePropertyConfiguration(
  id: string,
  input: PropertyConfigurationInput
): Promise<PropertyConfiguration> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update(toPayload(input))
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating configuration");
  return data as unknown as PropertyConfiguration;
}

export async function deletePropertyConfiguration(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  throwOnError(error, "Deleting configuration");
}

export async function reorderPropertyConfigurations(
  ids: string[]
): Promise<void> {
  const supabase = getSupabase();
  await Promise.all(
    ids.map(async (id, index) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ display_order: index })
        .eq("id", id);
      throwOnError(error, "Reordering configurations");
    })
  );
}

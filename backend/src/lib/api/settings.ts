import type { BusinessSettings, SiteBranding, SiteSetting } from "@/types";
import type { BusinessSettingsInput } from "@/lib/validations";

import { getSupabase, throwOnError } from "./client";

const TABLE = "site_settings";
const BRANDING_TABLE = "site_branding";
export const BUSINESS_SETTINGS_KEY = "business";

export const defaultBusinessSettings: BusinessSettings = {
  business_name: "Parmar Properties",
  phone: "",
  email: "",
  office_address: "",
  whatsapp: "",
  currency: "INR",
  social_links: {},
};

export async function getSetting(key: string): Promise<SiteSetting | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("key", key)
    .maybeSingle();

  throwOnError(error, "Loading settings");
  return (data as unknown as SiteSetting) ?? null;
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const setting = await getSetting(BUSINESS_SETTINGS_KEY);
  if (!setting) return defaultBusinessSettings;

  return {
    ...defaultBusinessSettings,
    ...(setting.value as Partial<BusinessSettings>),
    social_links: {
      ...defaultBusinessSettings.social_links,
      ...((setting.value as Partial<BusinessSettings>)?.social_links ?? {}),
    },
  };
}

export async function saveBusinessSettings(
  input: BusinessSettingsInput
): Promise<BusinessSettings> {
  const supabase = getSupabase();
  const existing = await getSetting(BUSINESS_SETTINGS_KEY);
  const value = input as unknown as Record<string, unknown>;

  if (existing) {
    const { error } = await supabase
      .from(TABLE)
      .update({ value })
      .eq("id", existing.id);
    throwOnError(error, "Saving settings");
  } else {
    const { error } = await supabase
      .from(TABLE)
      .insert({ key: BUSINESS_SETTINGS_KEY, value });
    throwOnError(error, "Saving settings");
  }

  return getBusinessSettings();
}

/**
 * Currency code used across the admin for money formatting.
 */
export async function getCurrency(): Promise<string> {
  const settings = await getBusinessSettings();
  return settings.currency || "INR";
}

/**
 * Global corporate branding for the public site (firm RERA, office, contacts).
 * Singleton row `id = 1`. Returns null if the table has not been seeded yet.
 */
export async function getSiteBranding(): Promise<SiteBranding | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(BRANDING_TABLE)
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  throwOnError(error, "Loading site branding");
  return (data as unknown as SiteBranding) ?? null;
}

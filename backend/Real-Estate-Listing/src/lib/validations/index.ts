import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const heroSlideSchema = z.object({
  heading: z.string().min(1, "Heading is required").max(200),
  supporting_text: z.string().max(500).optional().nullable(),
  cta_label: z.string().max(100).optional().nullable(),
  cta_url: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const locationSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  tagline: z.string().max(250).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const marketIntelligenceSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  value: z.string().min(1, "Value is required").max(80),
  unit: z.string().max(40).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  change_percentage: z.coerce.number().optional().nullable(),
  source: z.string().max(200).optional().nullable(),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  property_type: z.enum([
    "apartment",
    "villa",
    "penthouse",
    "plot",
    "commercial",
    "duplex",
    "other",
  ]),
  location_id: z.string().uuid().optional().nullable().or(z.literal("")),
  location_name: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  locality: z.string().max(120).optional().nullable(),
  location_details: z.string().max(1000).optional().nullable(),
  tagline: z.string().max(250).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  project_overview: z.string().max(10000).optional().nullable(),
  project_details: z.string().max(10000).optional().nullable(),
  developer_name: z.string().max(200).optional().nullable(),
  developer_description: z.string().max(5000).optional().nullable(),
  price_amount: z.coerce.number().min(0).optional().nullable(),
  price_display: z.string().max(120).optional().nullable(),
  bhk: z.string().max(40).optional().nullable(),
  carpet_area: z.string().max(80).optional().nullable(),
  possession: z.string().max(120).optional().nullable(),
  availability: z.enum(["available", "limited", "sold_out", "coming_soon"]),
  status: z.enum([
    "active",
    "inactive",
    "sold_out",
    "upcoming",
    "ready_to_move",
    "under_construction",
  ]),
  rera_number: z.string().max(120).optional().nullable(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  google_maps_url: z
    .string()
    .url("Enter a valid Google Maps URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
});

export const configurationSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  bhk: z.string().max(40).optional().nullable(),
  variant: z.string().max(120).optional().nullable(),
  carpet_area: z.string().max(80).optional().nullable(),
  possession: z.string().max(120).optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  price_display: z.string().max(120).optional().nullable(),
  availability: z.enum(["available", "limited", "sold_out", "coming_soon"]),
  status: z.string().max(40).default("active"),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const priceBreakdownSchema = z.object({
  label: z.string().min(1, "Label is required").max(120),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const floorPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  plan_type: z.enum(["floor_plan", "master_plan", "configuration_plan"]),
  configuration_id: z.string().uuid().optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const inventoryUnitSchema = z.object({
  unit_number: z.string().min(1, "Unit number is required").max(40),
  floor: z.string().max(40).optional().nullable(),
  facing: z.string().max(40).optional().nullable(),
  configuration_id: z.string().uuid().optional().nullable().or(z.literal("")),
  price: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(["available", "booked", "hold", "sold"]),
  notes: z.string().max(1000).optional().nullable(),
});

export const amenitySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  icon: z.string().max(80).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const businessSettingsSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(200),
  phone: z.string().max(40).optional().default(""),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  office_address: z.string().max(500).optional().default(""),
  whatsapp: z.string().max(40).optional().default(""),
  currency: z.string().min(1).max(10).default("INR"),
  social_links: z
    .object({
      facebook: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
    })
    .optional()
    .default({}),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type HeroSlideInput = z.infer<typeof heroSlideSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type MarketIntelligenceInput = z.infer<typeof marketIntelligenceSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type ConfigurationInput = z.infer<typeof configurationSchema>;
export type PriceBreakdownInput = z.infer<typeof priceBreakdownSchema>;
export type FloorPlanInput = z.infer<typeof floorPlanSchema>;
export type InventoryUnitInput = z.infer<typeof inventoryUnitSchema>;
export type AmenityInput = z.infer<typeof amenitySchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

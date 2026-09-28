export type PropertyStatus =
  | "active"
  | "inactive"
  | "sold_out"
  | "upcoming"
  | "ready_to_move"
  | "under_construction";

export type PropertyType =
  | "apartment"
  | "villa"
  | "penthouse"
  | "plot"
  | "commercial"
  | "duplex"
  | "other";

export type AvailabilityStatus =
  | "available"
  | "limited"
  | "sold_out"
  | "coming_soon";

export type FloorPlanType = "floor_plan" | "master_plan" | "configuration_plan";

export type InventoryStatus = "available" | "booked" | "hold" | "sold";

export type AdminRole = "admin" | "super_admin";

export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface Profile extends AuditFields {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
}

export interface HeroSlide extends AuditFields {
  id: string;
  heading: string;
  supporting_text: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_path: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Location extends AuditFields {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  image_path: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface MarketIntelligence extends AuditFields {
  id: string;
  title: string;
  value: string;
  unit: string | null;
  description: string | null;
  change_percentage: number | null;
  source: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Property extends AuditFields {
  id: string;
  name: string;
  slug: string;
  property_type: PropertyType;
  location_id: string | null;
  location_name: string | null;
  city: string | null;
  locality: string | null;
  location_details: string | null;
  tagline: string | null;
  description: string | null;
  project_overview: string | null;
  project_details: string | null;
  developer_name: string | null;
  developer_description: string | null;
  price_amount: number | null;
  price_display: string | null;
  bhk: string | null;
  carpet_area: string | null;
  possession: string | null;
  availability: AvailabilityStatus;
  status: PropertyStatus;
  rera_number: string | null;
  rera_qr_path: string | null;
  rera_qr_url: string | null;
  brochure_path: string | null;
  brochure_url: string | null;
  is_featured: boolean;
  featured_order: number | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  address: string | null;
  deleted_at: string | null;
}

export interface PropertyImage extends AuditFields {
  id: string;
  property_id: string;
  path: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
}

export interface Configuration extends AuditFields {
  id: string;
  property_id: string;
  name: string;
  bhk: string | null;
  variant: string | null;
  carpet_area: string | null;
  possession: string | null;
  price: number | null;
  price_display: string | null;
  availability: AvailabilityStatus;
  status: string;
  display_order: number;
}

export interface PriceBreakdown extends AuditFields {
  id: string;
  configuration_id: string;
  label: string;
  amount: number;
  display_order: number;
}

export interface FloorPlan extends AuditFields {
  id: string;
  property_id: string;
  configuration_id: string | null;
  name: string;
  plan_type: FloorPlanType;
  image_path: string | null;
  image_url: string | null;
  file_path: string | null;
  file_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Amenity extends AuditFields {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
}

export interface PropertyAmenity {
  id: string;
  property_id: string;
  amenity_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  amenity?: Amenity;
}

export interface InventoryUnit extends AuditFields {
  id: string;
  property_id: string;
  configuration_id: string | null;
  unit_number: string;
  floor: string | null;
  facing: string | null;
  price: number | null;
  status: InventoryStatus;
  notes: string | null;
}

export interface SiteSetting extends AuditFields {
  id: string;
  key: string;
  value: Record<string, unknown>;
}

export interface BusinessSettings {
  business_name: string;
  phone: string;
  email: string;
  office_address: string;
  whatsapp: string;
  currency: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface PropertyWithRelations extends Property {
  images?: PropertyImage[];
  configurations?: Configuration[];
  floor_plans?: FloorPlan[];
  property_amenities?: PropertyAmenity[];
  inventory_units?: InventoryUnit[];
  location?: Location | null;
}

export interface ConfigurationWithBreakdown extends Configuration {
  price_breakdowns?: PriceBreakdown[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PropertyFilters {
  search?: string;
  status?: PropertyStatus | "";
  property_type?: PropertyType | "";
  bhk?: string;
  featured?: "true" | "false" | "";
  availability?: AvailabilityStatus | "";
  sort?: "newest" | "oldest" | "name" | "price" | "updated";
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  featuredProperties: number;
  availableUnits: number;
  recentlyUpdated: Property[];
  recentlyAdded: Property[];
}

import { getSupabase } from './client';
import { PROPERTIES } from '@/data/properties';
import type { Property, MumbaiLocality, PropertyType, PropertyLayoutVariant } from '@/types/property';

export function mapDbPropertyToFrontend(dbRow: Record<string, any>): Property {
  const price = Number(dbRow.price || dbRow.price_amount) || 0;
  const priceFormatted = price > 0 ? `₹${price.toFixed(2)} Cr` : (dbRow.price_display || 'Price on Request');

  const images: string[] = [];
  if (Array.isArray(dbRow.property_images) && dbRow.property_images.length > 0) {
    dbRow.property_images
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .forEach((img: any) => {
        if (img.url) images.push(img.url);
      });
  } else if (dbRow.cover_image) {
    images.push(dbRow.cover_image);
  }

  const floorPlans: { title: string; area: string; description: string; image?: string }[] = [];
  const layoutVariants: PropertyLayoutVariant[] = [];
  if (Array.isArray(dbRow.property_configurations) && dbRow.property_configurations.length > 0) {
    dbRow.property_configurations
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .forEach((cfg: any) => {
        floorPlans.push({
          title: cfg.title || cfg.tab_label || 'Floor Plan',
          area: cfg.carpet_area || cfg.area_range || '',
          description: cfg.tower_zone || cfg.price_indicator || '',
          image: cfg.image_path || undefined,
        });

        layoutVariants.push({
          id: cfg.variant_code || cfg.id || 'variant',
          tabLabel: cfg.tab_label || cfg.name || 'Layout',
          title: cfg.title || cfg.name || 'Residence Layout',
          area: cfg.area_range || `${cfg.carpet_area || ''} sq.ft`,
          carpetArea: cfg.carpet_area ? `${cfg.carpet_area} Sq.Ft` : (cfg.area_range || ''),
          price: cfg.price_indicator || (cfg.price ? `₹${cfg.price} Cr` : 'Price on Request'),
          tower: cfg.tower_zone || 'Prime Tower',
          image: cfg.image_path || '/floorplans/unit-plan.jpg',
        });
      });
  }

  // Amenities: prioritize highlights array, fallback to default luxury set
  const amenitiesList = Array.isArray(dbRow.highlights) && dbRow.highlights.length > 0
    ? dbRow.highlights
    : ['Sea View', 'Private Elevator', '24/7 Concierge', 'Infinity Pool'];

  return {
    id: dbRow.id,
    slug: dbRow.slug,
    title: dbRow.title || dbRow.name || 'Prime Mumbai Residence',
    tagline: dbRow.tagline || '',
    location: (dbRow.locality || dbRow.location_name || 'Worli') as MumbaiLocality,
    subLocation: dbRow.sub_location || '',
    price,
    priceFormatted,
    bhk: dbRow.bhk || (dbRow.bhk_id ? `${dbRow.bhk_id} BHK` : '3 BHK'),
    carpetArea: Number(dbRow.carpet_area_sqft || dbRow.carpet_area) || 2000,
    superArea: Number(dbRow.super_area) || Math.round((Number(dbRow.carpet_area_sqft) || 2000) * 1.35),
    propertyType: (dbRow.property_type || 'Sea-Facing Apartment') as PropertyType,
    possession: (dbRow.possession || 'Ready to Move') as any,
    possessionDate: dbRow.possession_date || undefined,
    floor: dbRow.floor || 'High-Rise Sky Suites',
    featured: Boolean(dbRow.is_featured),
    recentlyAdded: Boolean(dbRow.recently_added),
    recommended: Boolean(dbRow.is_recommended),
    isNewLaunch: Boolean(dbRow.is_new_launch),
    isLuxuryCollection: Boolean(dbRow.is_luxury_collection || price >= 25),
    coverImage: dbRow.cover_image || images[0] || '/properties/worli-aurum/cover.jpg',
    images: images.length > 0 ? images : [dbRow.cover_image || '/properties/worli-aurum/cover.jpg'],
    amenities: amenitiesList,
    description: dbRow.description || dbRow.project_overview || '',
    highlights: Array.isArray(dbRow.highlights) ? dbRow.highlights : [],
    reraId: dbRow.rera_id || dbRow.rera_number || 'P51900000000',
    reraQrImage: dbRow.rera_qr_image || dbRow.rera_qr_url || undefined,
    brochureUrl: dbRow.brochure_url || undefined,
    developerName: dbRow.developer_name || undefined,
    developerDescription: dbRow.developer_description || undefined,
    googleMapsUrl: dbRow.google_maps_url || undefined,
    layoutVariants: layoutVariants.length > 0 ? layoutVariants : undefined,
    coordinates: dbRow.latitude && dbRow.longitude ? {
      lat: Number(dbRow.latitude),
      lng: Number(dbRow.longitude),
    } : undefined,
    floorPlans: floorPlans.length > 0 ? floorPlans : undefined,
  };
}

export async function fetchPublishedProperties(): Promise<Property[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return PROPERTIES;
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(*), property_configurations(*)')
      .or('publication_status.eq.published,status.eq.active')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return PROPERTIES;
    }

    return data.map(mapDbPropertyToFrontend);
  } catch (err) {
    console.warn('Failed to fetch properties from Supabase, falling back to static:', err);
    return PROPERTIES;
  }
}

export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return PROPERTIES.find((p) => p.slug === slug) || null;
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(*), property_configurations(*)')
      .eq('slug', slug)
      .or('publication_status.eq.published,status.eq.active')
      .maybeSingle();

    if (error || !data) {
      return PROPERTIES.find((p) => p.slug === slug) || null;
    }

    return mapDbPropertyToFrontend(data);
  } catch (err) {
    console.warn(`Failed to fetch property ${slug} from Supabase:`, err);
    return PROPERTIES.find((p) => p.slug === slug) || null;
  }
}

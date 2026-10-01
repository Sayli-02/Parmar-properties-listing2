import { getSupabase } from './client';

export interface LocationInfo {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  coverImage: string;
  priceRange: string;
  averageRate: string;
  lifestyle: string;
  keyEnclaves: string[];
  isPrimaryHome?: boolean;
  isFuture?: boolean;
}

export const FALLBACK_LOCATIONS: Record<string, LocationInfo> = {
  worli: {
    name: 'Worli',
    slug: 'worli',
    tagline: 'Mumbai’s Premier Sea-Facing Luxury Mile',
    description: 'Home to iconic skyline towers, the Bandra-Worli Sea Link promenade, and coveted multi-acre gated sky residences. Worli commands premier capital appreciation and uninterrupted Arabian Sea horizons.',
    coverImage: '/properties/worli-aurum/cover.jpg',
    priceRange: '₹18 Cr - ₹75 Cr+',
    averageRate: '₹65,000 - ₹1,20,000 / sq.ft',
    lifestyle: 'Sea Link Promenade, High-Rise Sky Mansions, Michelin Dining',
    keyEnclaves: ['Worli Sea Face', 'Dr. Annie Besant Road', 'Pochkhanawala Road'],
  },
  'bandra-west': {
    name: 'Bandra West',
    slug: 'bandra-west',
    tagline: 'The Cultural Epicenter of Discreet Elegance & Heritage',
    description: 'The address of choice for creative luminaries, legacy industrialists, and tastemakers. Bandra West blends quiet leafy enclaves like Pali Hill and Carter Road with world-class bistros and exclusive boutique towers.',
    coverImage: '/properties/bandra-palisades/cover.jpg',
    priceRange: '₹15 Cr - ₹60 Cr+',
    averageRate: '₹75,000 - ₹1,35,000 / sq.ft',
    lifestyle: 'Pali Hill Sanctuary, Carter Road Promenade, Boutique Living',
    keyEnclaves: ['Pali Hill', 'Bandstand', 'Carter Road', 'Perry Cross Road'],
  },
  juhu: {
    name: 'Juhu',
    slug: 'juhu',
    tagline: 'Sun-Drenched Coastal Estates & Cinematic Glamour',
    description: 'Mumbai’s original beachfront gold standard. Characterized by expansive private low-rise villas, sprawling penthouses overlooking private sands, and ultimate discreet coastal living.',
    coverImage: '/properties/juhu-solitaire/cover.jpg',
    priceRange: '₹20 Cr - ₹120 Cr+',
    averageRate: '₹70,000 - ₹1,40,000 / sq.ft',
    lifestyle: 'Direct Beach Access, Private Villa Compounds, Low-Density Living',
    keyEnclaves: ['Juhu Tara Road', 'Ruia Park', 'JVPD Scheme', 'Gulmohar Avenue'],
  },
  'malabar-hill': {
    name: 'Malabar Hill',
    slug: 'malabar-hill',
    tagline: 'The Zenith of Generational Power & Prestige',
    description: 'Mumbai’s oldest and most closely guarded pin code. An ultra-exclusive hill promontory offering commanding vistas over Back Bay and Queens Necklace, home to business dynasties and consular residences.',
    coverImage: '/properties/malabar-hill-manor/cover.jpg',
    priceRange: '₹35 Cr - ₹150 Cr+',
    averageRate: '₹95,000 - ₹1,80,000 / sq.ft',
    lifestyle: 'Hanging Gardens Promenade, Consular Enclaves, Utmost Seclusion',
    keyEnclaves: ['Walkeshwar Road', 'Little Gibbs Road', 'Ridge Road', 'Doongersey Road'],
  },
};

export function mapDbLocationToFrontend(row: Record<string, any>): LocationInfo {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '-'),
    tagline: row.tagline || '',
    description: row.description || '',
    coverImage: row.cover_image || row.image_url || '/properties/worli-aurum/cover.jpg',
    priceRange: row.price_range || 'Price on Request',
    averageRate: row.average_rate || '₹65,000 - ₹1,20,000 / sq.ft',
    lifestyle: row.lifestyle || '',
    keyEnclaves: Array.isArray(row.key_enclaves) ? row.key_enclaves : [],
    isPrimaryHome: Boolean(row.is_primary_home),
    isFuture: Boolean(row.is_future),
  };
}

export async function fetchLocations(): Promise<LocationInfo[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return Object.values(FALLBACK_LOCATIONS);
  }

  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return Object.values(FALLBACK_LOCATIONS);
    }

    return data.map(mapDbLocationToFrontend);
  } catch (err) {
    console.warn('Failed to fetch locations from Supabase, using fallback:', err);
    return Object.values(FALLBACK_LOCATIONS);
  }
}

export async function fetchLocationBySlug(slug: string): Promise<LocationInfo | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return FALLBACK_LOCATIONS[slug] || null;
  }

  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return FALLBACK_LOCATIONS[slug] || null;
    }

    return mapDbLocationToFrontend(data);
  } catch (err) {
    console.warn(`Failed to fetch location ${slug} from Supabase:`, err);
    return FALLBACK_LOCATIONS[slug] || null;
  }
}

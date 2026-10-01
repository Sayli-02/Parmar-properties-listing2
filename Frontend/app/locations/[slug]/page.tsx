'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowLeft, ArrowRight, ShieldCheck, Building2, TrendingUp, Phone, Mail } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { PROPERTIES } from '@/data/properties';
import { Property } from '@/types/property';
import { fetchLocationBySlug } from '@/lib/supabase/locations';
import { fetchPublishedProperties } from '@/lib/supabase/properties';

interface LocationInfo {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  coverImage: string;
  priceRange: string;
  averageRate: string;
  lifestyle: string;
  keyEnclaves: string[];
}

const LOCATION_DATA: Record<string, LocationInfo> = {
  worli: {
    name: 'Worli',
    slug: 'worli',
    tagline: 'Mumbai’s Premier Sea-Facing Luxury Mile',
    description:
      'Home to iconic skyline towers, the Bandra-Worli Sea Link promenade, and coveted multi-acre gated sky residences. Worli commands premier capital appreciation and uninterrupted Arabian Sea horizons.',
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
    description:
      'The address of choice for creative luminaries, legacy industrialists, and tastemakers. Bandra West blends quiet leafy enclaves like Pali Hill and Carter Road with world-class bistros and exclusive boutique towers.',
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
    description:
      'Mumbai’s original beachfront gold standard. Characterized by expansive private low-rise villas, sprawling penthouses overlooking private sands, and ultimate discreet coastal living.',
    coverImage: '/properties/juhu-solitaire/cover.jpg',
    priceRange: '₹20 Cr - ₹120 Cr+',
    averageRate: '₹70,000 - ₹1,40,000 / sq.ft',
    lifestyle: 'Direct Beach Access, Private Villa Compounds, Low-Density Living',
    keyEnclaves: ['Juhu Tara Road', 'Ruia Park', 'JVPD Scheme', 'Gulmohar Avenue'],
  },
  'malabar-hill': {
    name: 'Malabar Hill',
    slug: 'malabar-hill',
    tagline: 'Generational Prestige & Queens Necklace Panoramas',
    description:
      'The historical pinnacle of power and quiet old-money prestige in South Mumbai. Unrivaled panoramic vistas over Back Bay, Hanging Gardens, and lush governor hill canopies.',
    coverImage: '/hero/hero-1-crisp.jpg',
    priceRange: '₹35 Cr - ₹150 Cr+',
    averageRate: '₹1,00,000 - ₹1,85,000 / sq.ft',
    lifestyle: 'Old Bombay Heritage, Back Bay Panoramas, Diplomatic Enclaves',
    keyEnclaves: ['Walkeshwar Road', 'Ridge Road', 'Nepeansea Road', 'Carmichael Road'],
  },
  prabhadevi: {
    name: 'Prabhadevi',
    slug: 'prabhadevi',
    tagline: 'Refined Coastal Grandeur Near Siddhivinayak',
    description:
      'A prestigious South Mumbai beachfront and skyline enclave offering seamless Sea Link connectivity, tranquil residential avenues, and unobstructed sunsets.',
    coverImage: '/properties/prabhadevi-verve/cover.jpg',
    priceRange: '₹18 Cr - ₹55 Cr+',
    averageRate: '₹62,000 - ₹1,05,000 / sq.ft',
    lifestyle: 'Beachfront Promenade, Temple Heritage, High-Rise Penthouses',
    keyEnclaves: ['Siddhivinayak Horizon', 'Kirti College Seafront', 'Sayani Road High-Rises'],
  },
  'lower-parel': {
    name: 'Lower Parel',
    slug: 'lower-parel',
    tagline: 'Midtown High-Rise Sky Suites & Financial District',
    description:
      'Mumbai’s premier corporate corridor and luxury vertical community. Home to world-class dining, luxury retail gallerias, and multi-acre integrated residential estates.',
    coverImage: '/properties/lower-parel-pavilion/cover.jpg',
    priceRange: '₹12 Cr - ₹45 Cr+',
    averageRate: '₹55,000 - ₹95,000 / sq.ft',
    lifestyle: 'Vertical Cities, Luxury Mall Access, High-Speed Financial Hub',
    keyEnclaves: ['Senapati Bapat Marg', 'Curry Road Avenue', 'Delisle Road Enclaves'],
  },
  powai: {
    name: 'Powai',
    slug: 'powai',
    tagline: 'Lakeside Sanctuary & Modern Architectural Boulevard',
    description:
      'Mumbai’s prime neoclassical sanctuary. Lush hillside panoramic views, Powai Lake shorelines, elite international schooling, and gated condominium estates.',
    coverImage: '/properties/powai-lake/cover.jpg',
    priceRange: '₹8 Cr - ₹25 Cr+',
    averageRate: '₹38,000 - ₹65,000 / sq.ft',
    lifestyle: 'Lakefront Jogging, Neoclassical Promenades, Tech Executive Estates',
    keyEnclaves: ['Hiranandani Gardens', 'Powai Lake Promenade', 'Cliff Avenue'],
  },
  sewri: {
    name: 'Sewri',
    slug: 'sewri',
    tagline: 'Eastern Waterfront Gateway Facing Atal Setu',
    description:
      'The focal point of Mumbai’s eastern bay transformation. Direct Atal Setu (MTHL) transit, expansive mangrove bird sanctuaries, and massive high-rise capital appreciation.',
    coverImage: '/hero/hero-3-crisp.jpg',
    priceRange: '₹10 Cr - ₹28 Cr+',
    averageRate: '₹40,000 - ₹70,000 / sq.ft',
    lifestyle: 'MTHL Connectivity, Harbor Views, Flamingo Sanctuary Panoramas',
    keyEnclaves: ['Sewri Seafront Promenade', 'Eastern Bay Corridor', 'Port Trust Bay'],
  },
  'cuffe-parade': {
    name: 'Cuffe Parade',
    slug: 'cuffe-parade',
    tagline: 'Exclusive Southern Promontory & Diplomatic Heritage',
    description:
      'The southern tip of Mumbai’s legacy luxury district. Waterfront high-rises, diplomatic consulates, world trade towers, and timeless Colaba proximity.',
    coverImage: '/hero/hero-2-crisp.jpg',
    priceRange: '₹22 Cr - ₹85 Cr+',
    averageRate: '₹75,000 - ₹1,40,000 / sq.ft',
    lifestyle: 'Yacht Club Proximity, Diplomatic Corridors, Coastal Skyline',
    keyEnclaves: ['Prakash Pethe Marg', 'Cuffe Parade Promontory', 'Captain Prakash Pethe Marg'],
  },
};

// Fallback mock properties if location doesn't have enough matching seed items
const MOCK_LOCATION_FALLBACKS: Record<string, Partial<Property>[]> = {
  worli: [
    {
      id: 'mock-worli-1',
      slug: 'the-aurum-sea-residence-worli',
      title: 'The Aurum Sea Residence',
      tagline: 'Direct Sea-Facing Trophy Residence with Panoramic Arabian Horizons',
      location: 'Worli',
      subLocation: 'Worli Sea Face, Mumbai',
      price: 32.5,
      priceFormatted: '₹32.50 Cr',
      bhk: '4 BHK',
      carpetArea: 3850,
      superArea: 4800,
      propertyType: 'Penthouse',
      possession: 'Ready to Move',
      floor: '42nd Floor of 50',
      featured: true,
      recentlyAdded: false,
      recommended: true,
      coverImage: '/properties/worli-aurum/cover.jpg',
      images: ['/properties/worli-aurum/cover.jpg', '/hero/hero-1-crisp.jpg'],
      amenities: ['Private Lap Pool', 'Direct Sea Link View', 'Concierge Desk', '3 Car Parking'],
      description: 'Exclusive 4 BHK sky residence with 180° uninterrupted Arabian sea horizons in prime Worli.',
      highlights: ['Direct Sea View', 'Private elevator', 'Triple-height lobby'],
      coordinates: { lat: 19.0144, lng: 72.8159 },
    },
    {
      id: 'mock-worli-2',
      slug: 'worli-sea-breeze-pavilion',
      title: 'Sea Breeze Pavilion Worli',
      tagline: 'Skyline Icon Overlooking Mahalaxmi Racecourse & Sea',
      location: 'Worli',
      subLocation: 'Dr. Annie Besant Road, Worli',
      price: 27.5,
      priceFormatted: '₹27.50 Cr',
      bhk: '4 BHK',
      carpetArea: 3100,
      superArea: 4100,
      propertyType: 'Sky Villa',
      possession: 'Ready to Move',
      floor: '38th Floor of 65',
      featured: true,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/properties/prabhadevi-verve/cover.jpg',
      images: ['/properties/prabhadevi-verve/cover.jpg', '/hero/hero-2-crisp.jpg'],
      amenities: ['Dual Sea & Racecourse Views', 'Infinity Pool', 'Screening Theatre'],
      description: 'Perched high in an iconic Worli landmark with dual vistas of the sea and racecourse.',
      highlights: ['Dual-aspect view', 'Double-height sundeck', 'Private elevators'],
      coordinates: { lat: 19.005, lng: 72.818 },
    },
  ],
  prabhadevi: [
    {
      id: 'mock-prabhadevi-1',
      slug: 'verve-belvedere-prabhadevi',
      title: 'Verve Belvedere',
      tagline: 'Refined Coastal Grandeur Near Siddhivinayak',
      location: 'Prabhadevi',
      subLocation: 'Prabhadevi Seafront, South Mumbai',
      price: 21.8,
      priceFormatted: '₹21.80 Cr',
      bhk: '3 BHK',
      carpetArea: 2600,
      superArea: 3400,
      propertyType: 'Sea-Facing Apartment',
      possession: 'Ready to Move',
      floor: '28th Floor of 40',
      featured: true,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/properties/prabhadevi-verve/cover.jpg',
      images: ['/properties/prabhadevi-verve/cover.jpg', '/hero/hero-2-crisp.jpg'],
      amenities: ['State-of-the-Art Gymnasium', 'Yoga Pavilion', 'Private Elevators', 'Lush Podium Gardens'],
      description: 'Perfect harmony between cultural heritage and ultra-modern coastal architecture.',
      highlights: ['Unbroken view of Sea Link', 'LEED Platinum Certified', 'Vastu-compliant'],
      coordinates: { lat: 19.0166, lng: 72.8295 },
    },
    {
      id: 'mock-prabhadevi-2',
      slug: 'prabhadevi-ocean-heights',
      title: 'Ocean Heights Signature Residence',
      tagline: 'Direct Seafront Promenade Living in South Mumbai',
      location: 'Prabhadevi',
      subLocation: 'Kirti College Seafront, Prabhadevi',
      price: 28.5,
      priceFormatted: '₹28.50 Cr',
      bhk: '4 BHK',
      carpetArea: 3250,
      superArea: 4100,
      propertyType: 'Penthouse',
      possession: 'Ready to Move',
      floor: '35th Floor of 45',
      featured: true,
      recentlyAdded: false,
      recommended: true,
      coverImage: '/hero/hero-2-crisp.jpg',
      images: ['/hero/hero-2-crisp.jpg', '/properties/prabhadevi-verve/cover.jpg'],
      amenities: ['Private Plunge Pool', 'Double-Height Foyer', 'Concierge Service', '4 Car Bays'],
      description: 'A masterpiece on the Prabhadevi coastline with uninterrupted Arabian Sea horizon.',
      highlights: ['Panoramic sea deck', 'Bespoke Italian finishes', 'Private lift lobby'],
      coordinates: { lat: 19.017, lng: 72.828 },
    },
  ],
  'lower-parel': [
    {
      id: 'mock-lp-1',
      slug: 'the-pavilion-sky-villas-lower-parel',
      title: 'The Pavilion Sky Villas',
      tagline: 'Modern Opulence Above Mumbai’s Corporate & Lifestyle Epicenter',
      location: 'Lower Parel',
      subLocation: 'Senapati Bapat Marg, Lower Parel',
      price: 19.5,
      priceFormatted: '₹19.50 Cr',
      bhk: '4 BHK',
      carpetArea: 2900,
      superArea: 3750,
      propertyType: 'Sky Villa',
      possession: 'Ready to Move',
      floor: '55th Floor of 70',
      featured: true,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/properties/lower-parel-pavilion/cover.jpg',
      images: ['/properties/lower-parel-pavilion/cover.jpg', '/hero/hero-1-crisp.jpg'],
      amenities: ['Olympic Heated Pool', 'Screening Theatre', 'Squash Court', 'Helipad Access'],
      description: 'Rising grandly above Lower Parel, this sky villa commands breathtaking day-and-night skyline vistas.',
      highlights: ['Floor-to-ceiling glass curtain walls', 'Dedicated lifestyle concierge', 'Zero common walls'],
      coordinates: { lat: 18.9986, lng: 72.8315 },
    },
    {
      id: 'mock-lp-2',
      slug: 'lower-parel-grand-horizon',
      title: 'Grand Horizon Residences',
      tagline: 'Integrated Luxury Living in Central Mumbai’s Financial Hub',
      location: 'Lower Parel',
      subLocation: 'Curry Road Avenue, Lower Parel',
      price: 15.75,
      priceFormatted: '₹15.75 Cr',
      bhk: '3 BHK',
      carpetArea: 2200,
      superArea: 2900,
      propertyType: 'Sky Villa',
      possession: 'Ready to Move',
      floor: '41st Floor of 60',
      featured: false,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/hero/hero-3-crisp.jpg',
      images: ['/hero/hero-3-crisp.jpg', '/properties/lower-parel-pavilion/cover.jpg'],
      amenities: ['Clubhouse & Spa', 'Valet Parking', 'Childrens Play Arena', 'Business Center'],
      description: 'Effortless luxury in the heart of Mumbai midtown, adjacent to premier Michelin dining and high-street shopping.',
      highlights: ['Central connectivity', 'Double-height sundeck', 'Multi-tier biometric security'],
      coordinates: { lat: 18.995, lng: 72.83 },
    },
  ],
  powai: [
    {
      id: 'mock-powai-1',
      slug: 'lake-panache-estates-powai',
      title: 'The Panache Sky Suites',
      tagline: 'Tranquil Urban Luxury Overlooking Powai Lake',
      location: 'Powai',
      subLocation: 'Hiranandani Gardens, Powai',
      price: 14.5,
      priceFormatted: '₹14.50 Cr',
      bhk: '4 BHK',
      carpetArea: 2800,
      superArea: 3600,
      propertyType: 'Duplex',
      possession: 'Ready to Move',
      floor: '22nd & 23rd Duplex',
      featured: true,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/properties/powai-lake/cover.jpg',
      images: ['/properties/powai-lake/cover.jpg', '/hero/hero-3-crisp.jpg'],
      amenities: ['Lakeview Terrace', 'Private Spa Suite', 'Biophilic Atrium', 'Tennis Academy Access'],
      description: 'A bespoke double-storey duplex overlooking serene waters of Powai Lake and forested hill slopes.',
      highlights: ['Direct lakefront promenade views', 'Double-height cathedral ceilings', 'Minutes from Powai business centers'],
      coordinates: { lat: 19.1176, lng: 72.906 },
    },
    {
      id: 'mock-powai-2',
      slug: 'powai-cliff-sanctuary',
      title: 'Cliffside Sovereign Residences',
      tagline: 'Neoclassical Lakefront Mansions with Hillside Horizons',
      location: 'Powai',
      subLocation: 'Cliff Avenue, Powai',
      price: 11.2,
      priceFormatted: '₹11.20 Cr',
      bhk: '3 BHK',
      carpetArea: 2150,
      superArea: 2850,
      propertyType: 'Luxury Estate',
      possession: 'Ready to Move',
      floor: '18th Floor of 30',
      featured: false,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/hero/hero-1-crisp.jpg',
      images: ['/hero/hero-1-crisp.jpg', '/properties/powai-lake/cover.jpg'],
      amenities: ['Infinity Lake View Pool', 'Private Forest Trails', 'Club Royale', 'Automated EV Bays'],
      description: 'Lush greenery meets classical European stone architecture in Powai’s most prestigious elevated sector.',
      highlights: ['Unobstructed lake panorama', 'Lush biodiversity surrounds', 'Close to top international schools'],
      coordinates: { lat: 19.12, lng: 72.91 },
    },
  ],
  sewri: [
    {
      id: 'mock-sewri-1',
      slug: 'one-bayview-towers-sewri',
      title: 'One Bayview Promenade',
      tagline: 'Upcoming Coastal Tower Connected to Atal Setu (MTHL)',
      location: 'Sewri',
      subLocation: 'Marine Bay Corridor, Sewri',
      price: 12.8,
      priceFormatted: '₹12.80 Cr',
      bhk: '3 BHK',
      carpetArea: 1950,
      superArea: 2550,
      propertyType: 'Sea-Facing Apartment',
      possession: 'Pre-Launch',
      floor: 'Choice of High-Rise Floors',
      featured: true,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/hero/hero-3-crisp.jpg',
      images: ['/hero/hero-3-crisp.jpg', '/properties/lower-parel-pavilion/cover.jpg'],
      amenities: ['Flamingo Bay Panoramas', 'Direct Atal Setu Expressway Ramp', '50,000 sq.ft Podium Club'],
      description: 'Poised to become the eastern coastal icon of South-Central Mumbai with panoramic sea and flamingo sanctuary vistas.',
      highlights: ['Pre-launch priority pricing', 'High-capital-appreciation corridor', 'Direct connector to Navi Mumbai'],
      coordinates: { lat: 19.001, lng: 72.855 },
    },
    {
      id: 'mock-sewri-2',
      slug: 'sewri-harbor-crest',
      title: 'Harbor Crest Sky Residences',
      tagline: 'Front-Line Eastern Seaboard Sunrise Penthouses',
      location: 'Sewri',
      subLocation: 'Eastern Bay Promenade, Sewri',
      price: 16.5,
      priceFormatted: '₹16.50 Cr',
      bhk: '4 BHK',
      carpetArea: 2700,
      superArea: 3500,
      propertyType: 'Sky Villa',
      possession: 'Under Construction',
      floor: '32nd Floor of 48',
      featured: false,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/properties/worli-aurum/cover.jpg',
      images: ['/properties/worli-aurum/cover.jpg', '/hero/hero-3-crisp.jpg'],
      amenities: ['Bay-Facing Decks', 'Private Elevators', 'Rooftop Sky Lounge', 'Concierge & Valet'],
      description: 'Unbroken panoramic sunrise vistas over Mumbai harbor and the engineering marvel of Atal Setu.',
      highlights: ['Front-line harbor vistas', 'High speed city connectivity', 'Luxury clubhouse'],
      coordinates: { lat: 19.003, lng: 72.857 },
    },
  ],
  'cuffe-parade': [
    {
      id: 'mock-cp-1',
      slug: 'cuffe-parade-regalia',
      title: 'Cuffe Parade Regalia',
      tagline: 'Colaba Waterfront Haven with Arabian Sea Horizon',
      location: 'Cuffe Parade',
      subLocation: 'Cuffe Parade, South Mumbai',
      price: 36.0,
      priceFormatted: '₹36.00 Cr',
      bhk: '4 BHK',
      carpetArea: 3500,
      superArea: 4400,
      propertyType: 'Sea-Facing Apartment',
      possession: 'Ready to Move',
      floor: '31st Floor of 36',
      featured: true,
      recentlyAdded: false,
      recommended: true,
      coverImage: '/hero/hero-2-crisp.jpg',
      images: ['/hero/hero-2-crisp.jpg', '/properties/bandra-palisades/cover.jpg'],
      amenities: ['Deep Sea Facing Balconies', 'Private Foyer Elevators', 'Indoor Temperature Pool', 'Diplomatic Security Desk'],
      description: 'Commanding front-line sea frontage at the southern tip of Mumbai with maritime architecture and sunset views.',
      highlights: ['Front-line Arabian Sea frontage', 'Walkable to Colaba clubs', 'Ultra-low density community'],
      coordinates: { lat: 18.91, lng: 72.82 },
    },
    {
      id: 'mock-cp-2',
      slug: 'cuffe-promontory-penthouse',
      title: 'The Southern Promontory Penthouse',
      tagline: 'Diplomatic Enclave Trophy Penthouse Overlooking Harbor & Ocean',
      location: 'Cuffe Parade',
      subLocation: 'Captain Prakash Pethe Marg, Cuffe Parade',
      price: 48.0,
      priceFormatted: '₹48.00 Cr',
      bhk: '5 BHK',
      carpetArea: 4800,
      superArea: 6200,
      propertyType: 'Penthouse',
      possession: 'Ready to Move',
      floor: '34th Floor Signature Duplex',
      featured: true,
      recentlyAdded: true,
      recommended: true,
      coverImage: '/properties/worli-aurum/cover.jpg',
      images: ['/properties/worli-aurum/cover.jpg', '/hero/hero-2-crisp.jpg'],
      amenities: ['Private Rooftop Helipad Transfer', 'Private Heated Pool', 'Wine Cellar', '6 Car Reserved Parking'],
      description: 'One of South Mumbai’s most exclusive private addresses, offering generational prestige and 360-degree ocean views.',
      highlights: ['360-degree ocean & harbor vistas', 'Private rooftop observatory', 'Diplomatic security'],
      coordinates: { lat: 18.908, lng: 72.822 },
    },
  ],
};

export default function LocationPropertiesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string)?.toLowerCase() || 'worli';

  const [dbLocation, setDbLocation] = useState<LocationInfo | null>(LOCATION_DATA[slug] || null);
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);

  useEffect(() => {
    fetchLocationBySlug(slug).then((res) => {
      if (res) setDbLocation(res);
    });
    fetchPublishedProperties().then(setProperties);
  }, [slug]);

  const location = useMemo(() => {
    return (
      dbLocation ||
      LOCATION_DATA[slug] || {
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
        tagline: 'Curated Luxury Residences & Private Enclaves',
        description:
          'Explore handpicked luxury properties, verified clear titles, and prime residential developments in this sought-after Mumbai neighbourhood.',
        coverImage: '/properties/bandra-palisades/cover.jpg',
        priceRange: '₹15 Cr - ₹80 Cr+',
        averageRate: '₹60,000 - ₹1,10,000 / sq.ft',
        lifestyle: 'Prime Connectivity, High-Rise Luxury, Coveted Enclave',
        keyEnclaves: ['Prime Corridors', 'Bespoke Towers', 'Avenue Belts'],
      }
    );
  }, [dbLocation, slug]);

  // Find real properties in this location or provide fallback data
  const locationProperties = useMemo(() => {
    const matched = properties.filter((p) => {
      const pLoc = p.location.toLowerCase();
      const pSub = p.subLocation.toLowerCase();
      const target = location.name.toLowerCase();
      return pLoc.includes(target) || pSub.includes(target) || target.includes(pLoc);
    });

    const fallbacks = (MOCK_LOCATION_FALLBACKS[slug] || []) as Property[];
    const combined = [...matched];
    for (const fb of fallbacks) {
      if (!combined.some((item) => item.id === fb.id || item.slug === fb.slug)) {
        combined.push(fb as Property);
      }
    }

    if (combined.length > 0) return combined;
    return (MOCK_LOCATION_FALLBACKS.worli || []) as Property[];
  }, [properties, location, slug]);

  return (
    <div className="w-full min-h-screen bg-[#EDEEE9] text-[#15181A] pt-24">
      {/* Hero Banner for Location */}
      <section className="relative bg-[#15181A] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src={location.coverImage}
            alt={location.name}
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#15181A] via-[#15181A]/85 to-transparent" />

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 mb-6 font-sans">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/#properties" className="hover:text-white transition-colors">
              Locations
            </Link>
            <span>/</span>
            <span className="text-[#C5282F] font-semibold">{location.name}</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-[10px] uppercase tracking-[0.25em] font-bold text-[#C5282F] mb-4">
              <MapPin className="w-3 h-3 text-[#C5282F]" />
              <span>MUMBAI ENCLAVE SHOWCASE</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight mb-4">
              {location.name.toUpperCase()}
            </h1>
            <p className="text-sm sm:text-base text-white/80 font-sans leading-relaxed mb-8">
              {location.tagline} &bull; {location.description}
            </p>

            {/* Micro Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/50">Price Band</span>
                <span className="text-sm sm:text-base font-serif font-bold text-white">{location.priceRange}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/50">Average Capital Rate</span>
                <span className="text-sm sm:text-base font-serif font-bold text-white">{location.averageRate}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase tracking-wider text-white/50">Key Enclaves</span>
                <span className="text-xs text-white/80 font-medium truncate block">
                  {location.keyEnclaves.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Properties List */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-6 border-b border-[#CFD1CA] gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#C5282F] mb-1 block">
              Filtered By Location
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#15181A]">
              RESIDENCES IN {location.name.toUpperCase()}
            </h2>
            <p className="text-xs text-[#5B605F] mt-1 font-sans">
              Displaying vetted luxury listings and private opportunities currently available in {location.name}.
            </p>
          </div>

          <Link
            href="/#properties"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#15181A] hover:text-[#C5282F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore All Locations</span>
          </Link>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locationProperties.map((property, idx) => (
            <ScrollReveal key={property.id} animation="fade-up" delay={idx * 100}>
              <PropertyCard property={property as Property} />
            </ScrollReveal>
          ))}
        </div>

        {/* Other Locations Quick Switcher */}
        <div className="mt-20 pt-12 border-t border-[#CFD1CA]">
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#5B605F] mb-6">
            SWITCH TO ANOTHER PRIME CORRIDOR
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.values(LOCATION_DATA).map((loc) => (
              <Link
                key={loc.slug}
                href={`/locations/${loc.slug}`}
                className={`p-4 border text-left transition-all ${
                  loc.slug === slug
                    ? 'bg-[#15181A] text-white border-[#15181A]'
                    : 'bg-[#F7F7F4] text-[#15181A] border-[#CFD1CA] hover:border-[#C5282F]'
                }`}
              >
                <span className="text-xs font-serif font-bold block">{loc.name}</span>
                <span
                  className={`text-[10px] uppercase tracking-wider block mt-1 ${
                    loc.slug === slug ? 'text-[#C5282F]' : 'text-[#5B605F]'
                  }`}
                >
                  {loc.priceRange}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

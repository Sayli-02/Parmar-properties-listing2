'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowLeft, ArrowRight, ShieldCheck, Building2, TrendingUp, Phone, Mail } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { PROPERTIES } from '@/data/properties';
import { Property } from '@/types/property';

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
};

export default function LocationPropertiesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string)?.toLowerCase() || 'worli';

  const location = useMemo(() => {
    return (
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
  }, [slug]);

  // Find real properties in this location or provide mock data
  const locationProperties = useMemo(() => {
    const matched = PROPERTIES.filter((p) => {
      const pLoc = p.location.toLowerCase();
      const pSub = p.subLocation.toLowerCase();
      const target = location.name.toLowerCase();
      return pLoc.includes(target) || pSub.includes(target) || target.includes(pLoc);
    });

    if (matched.length > 0) return matched;

    // Use mock fallback if none matched
    const fallbacks = (MOCK_LOCATION_FALLBACKS[slug] || MOCK_LOCATION_FALLBACKS.worli) as Property[];
    return fallbacks;
  }, [location, slug]);

  return (
    <div className="w-full min-h-screen bg-[#EDEEE9] text-[#15181A] pt-24">
      <Navbar />

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

        {/* Future Pipeline Note */}
        <div className="mt-8 py-4 px-6 bg-[#F7F7F4] border border-[#CFD1CA] flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5282F]">
            FUTURE LOCATIONS :
          </span>
          <span className="text-[#5B605F] font-medium">
            Sewri, Lower Parel, Prabhadevi, Powai, Cuffe Parade and upcoming enclaves
          </span>
        </div>
      </section>

      <Footer />
    </div>
  );
}

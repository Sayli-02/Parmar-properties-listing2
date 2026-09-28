'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Lock,
  ArrowRight,
  Shield,
  Building2,
  BedDouble,
  Maximize2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PROPERTIES } from '@/data/properties';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';
import { PrivateOpportunities } from '@/components/property/PrivateOpportunities';
import { LOCATIONS_PAGE_CONTENT } from '@/data/content/locations.content';

interface UpcomingLocationProperty {
  id: string;
  title: string;
  tagline: string;
  location: string;
  subLocation: string;
  priceFormatted: string;
  bhk: string;
  carpetArea: number;
  propertyType: string;
  coverImage: string;
  status: string;
}

const UPCOMING_PROPERTIES: UpcomingLocationProperty[] = [
  {
    id: 'up-sewri',
    title: 'The Baypoint Promenade',
    tagline: 'Upcoming Eastern Seafront Corridor Facing Atal Setu (MTHL)',
    location: 'Sewri',
    subLocation: 'Sewri Seafront Promenade, Eastern Waterfront',
    priceFormatted: 'From ₹12.80 Cr',
    bhk: '3 & 4 BHK',
    carpetArea: 2100,
    propertyType: 'Sea-Facing Apartment',
    coverImage: '/properties/lower-parel-pavilion/cover.jpg',
    status: 'Upcoming / Future Pipeline',
  },
  {
    id: 'up-powai',
    title: 'Powai Vista Ridge',
    tagline: 'Upcoming Hillside Sanctuary Overlooking Powai Lake',
    location: 'Powai',
    subLocation: 'Hiranandani Gardens & Lakefront, Powai',
    priceFormatted: 'From ₹15.50 Cr',
    bhk: '3 & 4 BHK',
    carpetArea: 2300,
    propertyType: 'Duplex Villa',
    coverImage: '/properties/powai-lake/cover.jpg',
    status: 'Upcoming / Future Pipeline',
  },
  {
    id: 'up-prabhadevi',
    title: 'Siddhivinayak Horizon',
    tagline: 'Upcoming High-Rise Coastal Tower Near Sea Link',
    location: 'Prabhadevi',
    subLocation: 'Prabhadevi Coastal Mile, South Mumbai',
    priceFormatted: 'From ₹24.50 Cr',
    bhk: '4 BHK',
    carpetArea: 2950,
    propertyType: 'Sea-Facing Apartment',
    coverImage: '/properties/prabhadevi-verve/cover.jpg',
    status: 'Upcoming / Future Pipeline',
  },
  {
    id: 'up-cuffe',
    title: 'Cuffe Bay Reserve',
    tagline: 'Rare Upcoming Trophy Development in South Mumbai',
    location: 'Cuffe Parade',
    subLocation: 'Cuffe Parade Promontory',
    priceFormatted: 'From ₹38.00 Cr',
    bhk: '4 & 5 BHK',
    carpetArea: 3800,
    propertyType: 'Penthouse',
    coverImage: '/properties/bandra-palisades/cover.jpg',
    status: 'Upcoming / Future Pipeline',
  },
];

const LOCATIONS_LIST = [
  'All',
  'Worli',
  'Bandra West',
  'Juhu',
  'Malabar Hill',
  'Lower Parel',
  'Cuffe Parade',
  'BKC',
  'Upcoming',
];

function LocationsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams ? searchParams.get('tab') : null;
  const initialLoc = searchParams ? searchParams.get('location') : null;

  const [selectedLoc, setSelectedLoc] = useState<string>(
    initialTab === 'upcoming' ? 'Upcoming' : initialLoc || 'All'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [targetProperty, setTargetProperty] = useState<string>('');

  const filteredProperties = useMemo(() => {
    if (selectedLoc === 'All') return PROPERTIES;
    if (selectedLoc === 'Upcoming') return [];
    return PROPERTIES.filter((p) => p.location.toLowerCase() === selectedLoc.toLowerCase());
  }, [selectedLoc]);

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen bg-[#EDEEE9] text-[#15181A]">
      <ScrollProgressBar />

      {/* Breadcrumb */}
      <div className="text-xs uppercase tracking-widest text-[#5B605F] font-semibold mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:underline">Home</Link>
        <span>&bull;</span>
        <span className="text-[#C5282F] font-bold">LOCATIONS</span>
      </div>

      {/* Page Header */}
      <div className="mb-10 pb-6 border-b border-[#CFD1CA]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#15181A]">
              {LOCATIONS_PAGE_CONTENT.header.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#5B605F] mt-2 font-sans max-w-2xl leading-relaxed">
              {LOCATIONS_PAGE_CONTENT.header.subtitle}
            </p>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-[#C5282F] shrink-0">
            {selectedLoc === 'Upcoming'
              ? `${UPCOMING_PROPERTIES.length} Upcoming Locations Locked`
              : `${filteredProperties.length} Properties in View`}
          </div>
        </div>

        {/* Location Filter Selector Bar */}
        <div className="mt-8 flex flex-wrap gap-2 bg-[#F7F7F4] p-2 border border-[#CFD1CA] overflow-x-auto">
          {LOCATIONS_LIST.map((loc) => {
            const isSelected = selectedLoc === loc;
            const isUpcoming = loc === 'Upcoming';

            return (
              <button
                key={loc}
                onClick={() => setSelectedLoc(loc)}
                className={`py-2 px-4 text-xs uppercase tracking-[0.12em] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? isUpcoming
                      ? 'bg-[#15181A] text-white shadow-sm'
                      : 'bg-[#C5282F] text-white shadow-sm'
                    : isUpcoming
                    ? 'text-[#C5282F] border border-[#C5282F]/30 hover:bg-[#C5282F]/10'
                    : 'text-[#5B605F] hover:text-[#15181A] hover:bg-[#EDEEE9]'
                }`}
              >
                {isUpcoming && <Lock className="w-3 h-3 text-[#C5282F]" />}
                <span>{loc === 'Upcoming' ? 'Future Locations' : loc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE PROPERTIES LISTING */}
      {selectedLoc !== 'Upcoming' && (
        <div className="mb-20">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-20 bg-[#F7F7F4] border border-[#CFD1CA] p-8">
              <Building2 className="w-12 h-12 text-[#5B605F] mx-auto mb-4 opacity-40" />
              <h3 className="font-serif text-2xl text-[#15181A] mb-2 font-light">
                No Properties Available in {selectedLoc}
              </h3>
              <p className="text-sm text-[#5B605F] max-w-md mx-auto mb-6">
                We are actively curating new inventory in this location. Check our Upcoming Future Locations or contact our advisory desk.
              </p>
              <button
                onClick={() => setSelectedLoc('All')}
                className="px-6 py-2.5 bg-[#C5282F] text-white text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                View All Locations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, idx) => (
                <ScrollReveal key={property.id} animation="fade-up" delay={(idx % 3) * 100}>
                  <PropertyCard property={property} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FUTURE LOCATIONS / UPCOMING SECTION (WITH LOCK & UPCOMING BADGE) */}
      {(selectedLoc === 'Upcoming' || selectedLoc === 'All') && (
        <section id="upcoming-locations" className="mt-16 pt-16 border-t border-[#CFD1CA]">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#CFD1CA] gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#15181A] text-white text-[10px] uppercase tracking-[0.2em] font-bold mb-2">
                  <Lock className="w-3 h-3 text-[#C5282F]" />
                  <span>FUTURE ENCLAVES &bull; PRE-LAUNCH PIPELINE</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-[#15181A]">
                  Upcoming Location Pipeline
                </h2>
              </div>
              <p className="text-xs uppercase tracking-wider text-[#5B605F] font-semibold">
                Sewri &bull; Powai &bull; Prabhadevi &bull; Pre-Launch Pipeline
              </p>
            </div>
          </ScrollReveal>

          {/* Grid of Upcoming Properties with Lock and UPCOMING badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {UPCOMING_PROPERTIES.map((item, idx) => (
              <ScrollReveal key={item.id} animation="fade-up" delay={(idx % 3) * 120}>
                <div className="group bg-[#F7F7F4] border border-[#CFD1CA] hover:border-[#15181A] transition-all duration-300 flex flex-col overflow-hidden relative shadow-xs hover:shadow-md">
                  {/* Top Bar with Lock and UPCOMING Badge */}
                  <div className="relative aspect-[16/10] w-full bg-[#15181A] overflow-hidden">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover opacity-60 filter blur-[1px] group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/50" />

                    {/* Lock Icon Center Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-11 h-11 rounded-full bg-black/80 border border-white/20 flex items-center justify-center mb-1.5 shadow-lg">
                        <Lock className="w-5 h-5 text-[#C5282F]" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/90 font-semibold bg-black/60 px-2 py-0.5">
                        UPCOMING ENCLAVE
                      </span>
                    </div>

                    {/* Top Left UPCOMING Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#C5282F] text-white text-[10px] uppercase tracking-[0.15em] font-bold px-2.5 py-1 shadow">
                      <Lock className="w-3 h-3" />
                      <span>UPCOMING</span>
                    </div>

                    {/* Bottom Left Price Estimate */}
                    <div className="absolute bottom-0 left-0 bg-[#15181A] text-white px-3.5 py-1.5">
                      <span className="font-serif text-xs sm:text-sm font-medium">
                        {item.priceFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5B605F] mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C5282F]" />
                        <span>{item.subLocation}</span>
                      </div>

                      <h3 className="font-serif text-xl font-normal text-[#15181A] mb-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#5B605F] line-clamp-2 mb-4 font-sans leading-relaxed">
                        {item.tagline}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#CFD1CA] text-xs text-[#15181A]">
                        <div className="flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5 text-[#5B605F]" />
                          <span>{item.bhk}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-[#5B605F]" />
                          <span>{item.carpetArea} sq.ft</span>
                        </div>
                        <div className="text-right text-[#C5282F] font-semibold text-[11px] truncate flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Notify on Launch */}
                    <div className="pt-5">
                      <button
                        onClick={() => {
                          setTargetProperty(`${item.title} (${item.location})`);
                          setModalOpen(true);
                        }}
                        className="w-full py-2.5 px-4 bg-[#15181A] hover:bg-[#C5282F] text-white text-xs font-sans uppercase tracking-[0.12em] font-semibold text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#C5282F]" />
                        <span>NOTIFY ON LAUNCH</span>
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* PRIVATE OPPORTUNITIES AT BOTTOM */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-24">
        <PrivateOpportunities minimal={true} />
      </div>

      {/* QUICK NOTIFICATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#F7F7F4] border border-[#CFD1CA] p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#5B605F] hover:text-[#15181A]"
            >
              ✕
            </button>
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-[#15181A] text-[#C5282F] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-[#15181A]">
                Upcoming Enclave Registration
              </h3>
              <p className="text-xs text-[#5B605F]">
                Register your interest for <strong>{targetProperty}</strong>. Our Senior Advisor will send you priority floor plans and pre-launch pricing the moment RERA notifications are issued.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Thank you! Your interest in ${targetProperty} has been registered.`);
                  setModalOpen(false);
                }}
                className="space-y-3 pt-2 text-left text-xs"
              >
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Your Name</label>
                  <input required type="text" placeholder="e.g. Vikram Singhania" className="w-full p-2.5 bg-white border border-[#CFD1CA] text-xs outline-none focus:border-[#C5282F]" />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Mobile Number</label>
                  <input required type="tel" placeholder="+91 98200 00000" className="w-full p-2.5 bg-white border border-[#CFD1CA] text-xs outline-none focus:border-[#C5282F]" />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#C5282F] text-white text-xs uppercase tracking-widest font-semibold cursor-pointer mt-2"
                >
                  Confirm Priority Notification
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-xs">Loading Mumbai Enclaves...</div>}>
      <LocationsContent />
    </Suspense>
  );
}

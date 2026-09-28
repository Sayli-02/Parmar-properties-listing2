'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowUpDown,
  Filter,
  Building,
  Sparkles,
  Rocket,
  Crown,
  ShieldCheck,
  Calendar,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PrivateOpportunities } from '@/components/property/PrivateOpportunities';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';
import { PROPERTIES } from '@/data/properties';
import { PropertyCategory } from '@/types/property';
import { BUY_PAGE_CONTENT, NEW_LAUNCHES_CONTENT, LUXURY_COLLECTION_CONTENT } from '@/data/content';

function PropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Category Tab: 'buy' | 'new-launches' | 'luxury-collection'
  const rawTab = searchParams ? searchParams.get('tab') : null;
  const activeTab: PropertyCategory =
    rawTab === 'new-launches'
      ? 'new-launches'
      : rawTab === 'luxury-collection'
      ? 'luxury-collection'
      : 'buy';

  // Filter States
  const [selectedLocality, setSelectedLocality] = useState<string>(searchParams?.get('location') || 'All');
  const [selectedBhk, setSelectedBhk] = useState<string>(searchParams?.get('bhk') || 'All');
  const [selectedType, setSelectedType] = useState<string>(searchParams?.get('type') || 'All');
  const [selectedPossession, setSelectedPossession] = useState<string>(searchParams?.get('possession') || 'All');
  const [maxPrice, setMaxPrice] = useState<number>(Number(searchParams?.get('maxPrice')) || 60);
  const [selectedAmenity, setSelectedAmenity] = useState<string>(searchParams?.get('amenity') || 'All');
  const [sortBy, setSortBy] = useState<string>(searchParams?.get('sort') || 'featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Set active tab via router
  const handleTabChange = (tab: PropertyCategory) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  // Sync state to URL params (shallow)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'buy') params.set('tab', activeTab);
    if (selectedLocality !== 'All') params.set('location', selectedLocality);
    if (selectedBhk !== 'All') params.set('bhk', selectedBhk);
    if (selectedType !== 'All') params.set('type', selectedType);
    if (selectedPossession !== 'All') params.set('possession', selectedPossession);
    if (maxPrice < 60) params.set('maxPrice', maxPrice.toString());
    if (selectedAmenity !== 'All') params.set('amenity', selectedAmenity);
    if (sortBy !== 'featured') params.set('sort', sortBy);

    const query = params.toString();
    const newPath = query ? `/properties?${query}` : '/properties';
    router.replace(newPath, { scroll: false });
  }, [activeTab, selectedLocality, selectedBhk, selectedType, selectedPossession, maxPrice, selectedAmenity, sortBy, router]);

  const resetFilters = () => {
    setSelectedLocality('All');
    setSelectedBhk('All');
    setSelectedType('All');
    setSelectedPossession('All');
    setMaxPrice(60);
    setSelectedAmenity('All');
    setSortBy('featured');
  };

  // 1. Base categorized list
  const baseCategoryProperties = useMemo(() => {
    if (activeTab === 'new-launches') {
      return PROPERTIES.filter((p) => p.isNewLaunch);
    }
    if (activeTab === 'luxury-collection') {
      return PROPERTIES.filter((p) => p.isLuxuryCollection);
    }
    // BUY tab: All verified residences
    return PROPERTIES;
  }, [activeTab]);

  // Counts for each tab badge
  const counts = useMemo(() => {
    return {
      buy: PROPERTIES.length,
      newLaunches: PROPERTIES.filter((p) => p.isNewLaunch).length,
      luxuryCollection: PROPERTIES.filter((p) => p.isLuxuryCollection).length,
    };
  }, []);

  // 2. Filtered & sorted properties
  const filteredAndSortedProperties = useMemo(() => {
    let list = baseCategoryProperties.filter((p) => {
      if (selectedLocality !== 'All' && p.location !== selectedLocality) return false;
      if (selectedBhk !== 'All' && !p.bhk.includes(selectedBhk)) return false;
      if (selectedType !== 'All' && p.propertyType !== selectedType) return false;
      if (selectedPossession !== 'All' && p.possession !== selectedPossession) return false;
      if (p.price > maxPrice) return false;
      if (selectedAmenity !== 'All' && !p.amenities.includes(selectedAmenity)) return false;
      return true;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'area-desc') {
      list.sort((a, b) => b.carpetArea - a.carpetArea);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.recentlyAdded ? 1 : 0) - (a.recentlyAdded ? 1 : 0));
    }

    return list;
  }, [baseCategoryProperties, selectedLocality, selectedBhk, selectedType, selectedPossession, maxPrice, selectedAmenity, sortBy]);

  const allAmenities = [
    'All',
    'Infinity Sky Pool',
    'Private Elevator',
    'Private Plunge Pool',
    'Sea-Facing Balconies',
    'Automated Smart Home',
    'Clubhouse & Spa',
    'Valet Parking for 4 Cars',
    'Pre-Launch Price Advantage',
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen bg-[#EDEEE9] text-[#15181A]">
      {/* Top Scroll Progress Indicator */}
      <ScrollProgressBar />

      {/* Breadcrumb */}
      <div className="text-xs uppercase tracking-widest text-[#5B605F] font-semibold mb-3 flex items-center gap-1.5">
        <Link href="/" className="hover:underline">Home</Link>
        <span>&bull;</span>
        <span>Mumbai Portfolio</span>
        <span>&bull;</span>
        <span className="text-[#C5282F] font-bold">
          {activeTab === 'buy' && BUY_PAGE_CONTENT.header.breadcrumb}
          {activeTab === 'new-launches' && NEW_LAUNCHES_CONTENT.header.breadcrumb}
          {activeTab === 'luxury-collection' && LUXURY_COLLECTION_CONTENT.header.breadcrumb}
        </span>
      </div>

      {/* TOP 3-CATEGORY SELECTOR TABS: BUY | NEW LAUNCHES | LUXURY COLLECTION */}
      <div className="mb-10 pb-6 border-b border-[#CFD1CA]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#15181A]">
              {activeTab === 'buy' && BUY_PAGE_CONTENT.header.title}
              {activeTab === 'new-launches' && NEW_LAUNCHES_CONTENT.header.title}
              {activeTab === 'luxury-collection' && LUXURY_COLLECTION_CONTENT.header.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#5B605F] mt-2 font-sans max-w-2xl leading-relaxed">
              {activeTab === 'buy' && BUY_PAGE_CONTENT.header.subtitle}
              {activeTab === 'new-launches' && NEW_LAUNCHES_CONTENT.header.subtitle}
              {activeTab === 'luxury-collection' && LUXURY_COLLECTION_CONTENT.header.subtitle}
            </p>
          </div>

          {/* Quick Sort & Mobile Filter Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[#F7F7F4] border border-[#CFD1CA] text-xs uppercase tracking-wider font-semibold text-[#15181A]"
            >
              <Filter className="w-3.5 h-3.5 text-[#C5282F]" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2 text-xs bg-[#F7F7F4] border border-[#CFD1CA] px-3.5 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#C5282F]" />
              <span className="text-[#5B605F] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#15181A] focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured Curated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="area-desc">Carpet Area: Largest First</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prominent Architectural Segmented Tab Bar */}
        <div className="mt-8 flex flex-wrap gap-2 sm:gap-3 bg-[#F7F7F4] p-2 border border-[#CFD1CA]">
          {/* 1. BUY TAB */}
          <button
            onClick={() => handleTabChange('buy')}
            className={`flex-1 min-w-[140px] py-3 px-4 text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'buy'
                ? 'bg-[#C5282F] text-white shadow-sm'
                : 'text-[#5B605F] hover:text-[#15181A] hover:bg-[#EDEEE9]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{BUY_PAGE_CONTENT.header.tabLabel}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'buy' ? 'bg-white/20 text-white' : 'bg-[#CFD1CA]/60 text-[#15181A]'
              }`}
            >
              {counts.buy}
            </span>
          </button>

          {/* 2. NEW LAUNCHES TAB */}
          <button
            onClick={() => handleTabChange('new-launches')}
            className={`flex-1 min-w-[160px] py-3 px-4 text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'new-launches'
                ? 'bg-[#393187] text-white shadow-sm'
                : 'text-[#5B605F] hover:text-[#15181A] hover:bg-[#EDEEE9]'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{NEW_LAUNCHES_CONTENT.header.tabLabel}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'new-launches' ? 'bg-white/20 text-white' : 'bg-[#CFD1CA]/60 text-[#15181A]'
              }`}
            >
              {counts.newLaunches}
            </span>
          </button>

          {/* 3. LUXURY COLLECTION TAB */}
          <button
            onClick={() => handleTabChange('luxury-collection')}
            className={`flex-1 min-w-[180px] py-3 px-4 text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'luxury-collection'
                ? 'bg-[#15181A] text-white shadow-sm'
                : 'text-[#5B605F] hover:text-[#15181A] hover:bg-[#EDEEE9]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#C5282F]" />
            <span>{LUXURY_COLLECTION_CONTENT.header.tabLabel}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'luxury-collection' ? 'bg-white/20 text-white' : 'bg-[#CFD1CA]/60 text-[#15181A]'
              }`}
            >
              {counts.luxuryCollection}
            </span>
          </button>
        </div>

        {/* Tab Context Banner */}
        {activeTab === 'new-launches' && (
          <div className="mt-4 p-4 bg-[#393187]/10 border border-[#393187]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#393187] animate-pulse shrink-0" />
              <span className="font-semibold text-[#15181A]">
                Pre-Launch EOI Window Open:
              </span>
              <span className="text-[#5B605F]">
                Priority floor allocation, launch phase payment flexibilities &amp; MahaRERA approved milestones.
              </span>
            </div>
            <a
              href="#contact-eoi"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else router.push('/contact');
              }}
              className="text-[#393187] font-bold uppercase tracking-wider text-[11px] hover:underline shrink-0"
            >
              Register Pre-Launch EOI &rarr;
            </a>
          </div>
        )}


      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Left Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-[#F7F7F4] border border-[#CFD1CA] p-6 space-y-6 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-[#CFD1CA]">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#15181A] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C5282F]" />
                Filter {activeTab === 'new-launches' ? 'Launches' : activeTab === 'luxury-collection' ? 'Collection' : 'Portfolio'}
              </span>
              <button
                onClick={resetFilters}
                className="text-xs text-[#C5282F] hover:text-[#A31D23] flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Locality Filter */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#15181A] mb-2">
                Locality
              </label>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full p-2.5 bg-[#EDEEE9] border border-[#CFD1CA] text-xs focus:outline-none focus:border-[#C5282F]"
              >
                <option value="All">All Localities</option>
                <option value="Worli">Worli &amp; Sea Face</option>
                <option value="Bandra West">Bandra West &amp; Pali Hill</option>
                <option value="Juhu">Juhu Beachfront</option>
                <option value="Lower Parel">Lower Parel</option>
                <option value="Prabhadevi">Prabhadevi</option>
                <option value="Powai">Powai Waterfront</option>
                <option value="Malabar Hill">Malabar Hill</option>
                <option value="Cuffe Parade">Cuffe Parade</option>
                <option value="BKC">Bandra Kurla Complex</option>
                <option value="Khar West">Khar West</option>
                <option value="Sewri">Sewri &amp; MTHL Promenade</option>
              </select>
            </div>

            {/* BHK Filter */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#15181A] mb-2">
                Configuration (BHK)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['All', '3', '4', '5'].map((bhk) => (
                  <button
                    key={bhk}
                    onClick={() => setSelectedBhk(bhk)}
                    className={`py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      selectedBhk === bhk
                        ? 'bg-[#C5282F] text-white border-[#C5282F]'
                        : 'bg-[#EDEEE9] text-[#5B605F] border-[#CFD1CA] hover:bg-[#CFD1CA]'
                    }`}
                  >
                    {bhk === 'All' ? 'All' : `${bhk} BHK`}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#15181A] mb-2">
                Property Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2.5 bg-[#EDEEE9] border border-[#CFD1CA] text-xs focus:outline-none focus:border-[#C5282F]"
              >
                <option value="All">All Types</option>
                <option value="Sea-Facing Apartment">Sea-Facing Apartment</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Sky Villa">Sky Villa</option>
                <option value="Duplex">Duplex</option>
                <option value="Luxury Estate">Luxury Estate</option>
              </select>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#15181A]">
                  Max Budget
                </label>
                <span className="text-xs font-serif font-bold text-[#C5282F]">
                  ₹{maxPrice} Cr
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="60"
                step="2"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#C5282F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5B605F] mt-1">
                <span>₹12 Cr</span>
                <span>₹60 Cr</span>
              </div>
            </div>

            {/* Possession Filter */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#15181A] mb-2">
                Possession Timeline
              </label>
              <div className="space-y-1.5 text-xs text-[#15181A]">
                {['All', 'Ready to Move', 'Under Construction', 'Pre-Launch'].map((pos) => (
                  <label key={pos} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="possession"
                      checked={selectedPossession === pos}
                      onChange={() => setSelectedPossession(pos)}
                      className="accent-[#C5282F]"
                    />
                    <span>{pos === 'All' ? 'Any Possession' : pos}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prime Amenity */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#15181A] mb-2">
                Signature Amenity
              </label>
              <select
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value)}
                className="w-full p-2.5 bg-[#EDEEE9] border border-[#CFD1CA] text-xs focus:outline-none focus:border-[#C5282F]"
              >
                {allAmenities.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-sm bg-[#EDEEE9] h-full p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#CFD1CA]">
                <span className="font-serif text-lg font-medium text-[#15181A]">
                  Filter Residences
                </span>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-[#15181A]" />
                </button>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2">
                  Locality
                </label>
                <select
                  value={selectedLocality}
                  onChange={(e) => setSelectedLocality(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F7F4] border border-[#CFD1CA] text-xs"
                >
                  <option value="All">All Localities</option>
                  <option value="Worli">Worli</option>
                  <option value="Bandra West">Bandra West</option>
                  <option value="Juhu">Juhu</option>
                  <option value="Lower Parel">Lower Parel</option>
                  <option value="Prabhadevi">Prabhadevi</option>
                  <option value="Malabar Hill">Malabar Hill</option>
                  <option value="Sewri">Sewri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2">
                  BHK
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['All', '3', '4', '5'].map((bhk) => (
                    <button
                      key={bhk}
                      onClick={() => setSelectedBhk(bhk)}
                      className={`py-2 text-xs font-semibold border ${
                        selectedBhk === bhk
                          ? 'bg-[#C5282F] text-white border-[#C5282F]'
                          : 'bg-[#F7F7F4] border-[#CFD1CA]'
                      }`}
                    >
                      {bhk === 'All' ? 'All' : `${bhk} BHK`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Max Price</span>
                  <span className="text-[#C5282F] font-bold font-serif">₹{maxPrice} Cr</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="60"
                  step="2"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#C5282F]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={resetFilters}
                  className="w-1/2 py-3 border border-[#CFD1CA] text-xs uppercase tracking-wider font-semibold bg-[#F7F7F4]"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-1/2 py-3 bg-[#C5282F] text-white text-xs uppercase tracking-wider font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Main Property Cards Grid */}
        <main className="lg:col-span-9">
          {filteredAndSortedProperties.length === 0 ? (
            <div className="text-center py-20 bg-[#F7F7F4] border border-[#CFD1CA] p-8">
              <Building className="w-12 h-12 text-[#5B605F] mx-auto mb-4 opacity-40" />
              <h3 className="font-serif text-2xl text-[#15181A] mb-2 font-light">
                No Residences Found In This View
              </h3>
              <p className="text-sm text-[#5B605F] max-w-md mx-auto mb-6">
                Try widening your budget filter or switching categories to explore other verified Mumbai properties.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProperties.map((property, idx) => (
                <ScrollReveal key={property.id} animation="fade-up" delay={(idx % 3) * 100}>
                  <PropertyCard property={property} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* DISTINCT SECTION: PRIVATE OPPORTUNITIES */}
      {/* Explicitly separated and clarifying distinction from Luxury Collection */}
      <section className="mt-28 pt-16 border-t border-[#CFD1CA]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#15181A] text-white border border-[#23272A]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#C5282F] animate-ping" />
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#C5282F] block">
                SEPARATE DESK &bull; OFF-MARKET INVENTORY
              </span>
              <p className="text-xs text-[#CFD1CA] mt-0.5">
                Looking for unlisted, discreet trophy assets? Private Opportunities is separate from our public Luxury Collection and requires verified NDA access.
              </p>
            </div>
          </div>
        </div>

        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <PrivateOpportunities />
        </div>
      </section>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-xs">Loading Mumbai Residences...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}

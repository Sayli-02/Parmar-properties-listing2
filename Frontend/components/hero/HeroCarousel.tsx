'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRight, ChevronLeft, ChevronRight, Search, MapPin, BedDouble, Building2, IndianRupee, Check } from 'lucide-react';
import { HERO_SLIDES, SLIDE_DURATION_MS, TOTAL_SLIDES, PERSIST_HERO_COMPLETED } from '@/lib/constants';

export interface HeroSearchParams {
  location?: string;
  bhk?: string;
  budget?: string;
  type?: string;
}

interface HeroCarouselProps {
  onUnlockStateChange?: (unlocked: boolean) => void;
  onSearch?: (params: HeroSearchParams) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onUnlockStateChange, onSearch }) => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  // Search bar form state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchBhk, setSearchBhk] = useState('Any');
  const [searchMinBudget, setSearchMinBudget] = useState<number>(3);
  const [searchMaxBudget, setSearchMaxBudget] = useState<number>(50);
  const [searchStatus, setSearchStatus] = useState('All');
  const [openDropdown, setOpenDropdown] = useState<'location' | 'bhk' | 'budget' | 'status' | null>(null);
  // Default to unlocked initially until client checks sessionStorage to avoid flashes on return visits
  const [isLocked, setIsLocked] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Swipe gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Track slides seen to unlock when returning to slide 0 after viewing all 3
  const visitedSlidesRef = useRef<Set<number>>(new Set([0]));
  const isLockedRef = useRef(false);

  const unlockScroll = useCallback(() => {
    isLockedRef.current = false;
    setIsLocked(false);
    setHasUnlocked(true);

    if (PERSIST_HERO_COMPLETED) {
      try {
        sessionStorage.setItem('heroCompleted', 'true');
      } catch (e) {
        // Handle storage quota or private browsing exceptions
      }
    }

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    if (onUnlockStateChange) {
      onUnlockStateChange(true);
    }
  }, [onUnlockStateChange]);

  // Initial setup: Check sessionStorage, reduced motion, and initialize scroll-lock if fresh visit
  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setReducedMotion(true);
      unlockScroll();
      return;
    }

    // 2. Check returning visitor in sessionStorage
    let alreadyCompleted = false;
    if (PERSIST_HERO_COMPLETED) {
      try {
        alreadyCompleted = sessionStorage.getItem('heroCompleted') === 'true';
      } catch (e) {
        alreadyCompleted = false;
      }
    }

    if (alreadyCompleted) {
      setHasUnlocked(true);
      setIsLocked(false);
      isLockedRef.current = false;
      return;
    }

    // 3. Safeguard: If reloaded while scrolled past the hero, immediately unlock
    if (typeof window !== 'undefined' && window.scrollY > 50) {
      unlockScroll();
      return;
    }

    // 4. Fresh visit at top: activate scroll-lock until all 3 slides cycle
    isLockedRef.current = true;
    setIsLocked(true);
    setHasUnlocked(false);

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Lock html & body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Prevent scrolling events
    const preventScroll = (e: Event) => {
      if (isLockedRef.current) {
        e.preventDefault();
      }
    };

    const preventKeyScroll = (e: KeyboardEvent) => {
      if (!isLockedRef.current) return;
      const blockedKeys = [
        ' ',
        'Spacebar',
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
      ];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeyScroll, { passive: false });

    return () => {
      // Clean up completely on unmount so navigating away never leaves page locked
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventKeyScroll);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [unlockScroll]);

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const nextSlide = (prev + 1) % TOTAL_SLIDES;
      visitedSlidesRef.current.add(nextSlide);
      if (
        isLockedRef.current &&
        visitedSlidesRef.current.size >= TOTAL_SLIDES &&
        nextSlide === 0
      ) {
        unlockScroll();
      }
      return nextSlide;
    });
  }, [unlockScroll]);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const prevSlide = (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
      visitedSlidesRef.current.add(prevSlide);
      return prevSlide;
    });
  }, []);

  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      goToNextSlide();
    } else if (distance < -minSwipeDistance) {
      goToPrevSlide();
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.hero-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Slide rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      goToNextSlide();
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, [goToNextSlide]);

  return (
    <section
      id="hero"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group relative w-full h-[calc(100svh-80px)] min-h-[700px] md:min-h-[780px] lg:min-h-[820px] overflow-hidden bg-[#1C1C1C] select-none"
    >
      {/* Side Swipe / Navigation Controls */}
      <button
        onClick={goToPrevSlide}
        aria-label="Previous Slide"
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center bg-black/40 hover:bg-[#C5282F] text-white/80 hover:text-white border border-white/20 backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={goToNextSlide}
        aria-label="Next Slide"
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center bg-black/40 hover:bg-[#C5282F] text-white/80 hover:text-white border border-white/20 backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Background Slides */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = currentSlide === index;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            } ${reducedMotion ? 'transition-none' : ''}`}
            aria-hidden={!isActive}
          >
            {/* Background Full-Bleed Image with Gentle Cinematic Zoom */}
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                className={`object-cover object-center transition-transform duration-[5000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                sizes="100vw"
              />
              {/* Gradient Overlays for High Legibility & Cinematic Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/55" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
            </div>
          </div>
        );
      })}

      {/* Persistent Content Overlay: Tagline, Subtext & Floating Search Bar */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-6 pb-20 sm:pb-24">

        {/* Unified Tagline */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-light tracking-wide leading-tight drop-shadow-md mb-3">
          MUMBAI&apos;S FINEST ADDRESSES
        </h1>

        {/* Subtext */}
        <p className="font-sans text-xs sm:text-sm md:text-base text-[#CFD1CA] max-w-2xl font-light tracking-wide mb-2 leading-relaxed drop-shadow">
          Curated residences, private oppurtunities and investment properties across Mumbai&apos;s most sought after neighbourhoods
        </p>

        {/* Seamless Blended Luxury Architectural Search Console */}
        <div className="w-full mt-8 sm:mt-10 max-w-5xl mx-auto text-left px-2 sm:px-0 relative z-40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOpenDropdown(null);

              const hasLocation = Boolean(searchLocation && searchLocation.trim() && searchLocation !== 'All');
              const hasBhk = Boolean(searchBhk && searchBhk !== 'Any');
              const hasMinBudget = searchMinBudget > 3;
              const hasMaxBudget = searchMaxBudget < 60;
              const hasStatus = Boolean(searchStatus && searchStatus !== 'All' && searchStatus !== 'All Status');

              // If a user does not put any filter and simply just clicks, redirect to the BUY page
              if (!hasLocation && !hasBhk && !hasMinBudget && !hasMaxBudget && !hasStatus) {
                router.push('/properties?tab=buy');
                return;
              }

              const params = new URLSearchParams();
              params.set('tab', 'buy');
              if (hasLocation) params.set('location', searchLocation.trim());
              if (hasBhk) params.set('bhk', searchBhk);
              if (hasMinBudget) params.set('minPrice', searchMinBudget.toString());
              if (hasMaxBudget) params.set('maxPrice', searchMaxBudget.toString());
              if (hasStatus) params.set('status', searchStatus);
              router.push(`/properties?${params.toString()}`);
            }}
            className="bg-black/35 hover:bg-black/45 backdrop-blur-xl border border-white/20 hover:border-white/35 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] p-2 sm:p-2.5 transition-all duration-300 font-sans"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-0 items-center divide-y sm:divide-y-0 lg:divide-x divide-white/10">
              {/* 1. Location */}
              <div className="hero-dropdown-container lg:col-span-3 px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors group relative font-sans">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-extrabold text-white/80 mb-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-[#C5282F]" />
                  <span>Location</span>
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onFocus={() => setOpenDropdown('location')}
                    placeholder="Worli, Bandra, Juhu..."
                    className="w-full bg-transparent text-sm font-bold text-white placeholder:text-white/40 outline-none font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                    aria-label="Toggle location options"
                    className="text-white/60 hover:text-white ml-1.5 cursor-pointer"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${openDropdown === 'location' ? 'rotate-180 text-[#C5282F]' : ''}`} />
                  </button>
                </div>

                {openDropdown === 'location' && (
                  <div
                    style={{ backgroundColor: '#16181C' }}
                    className="absolute top-[calc(100%+8px)] left-0 min-w-[280px] sm:min-w-[310px] bg-[#16181C] border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.8)] p-3 z-50 rounded-sm font-sans"
                  >
                    <div className="px-3.5 pt-1 pb-2.5 text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold border-b border-white/10 mb-2 flex items-center justify-between">
                      <span>Prime Enclaves</span>
                      <span className="text-[9px] text-[#C5282F] font-semibold">Mumbai</span>
                    </div>
                    {[
                      { label: 'All Prime Locations', val: '' },
                      { label: 'Worli Sea Face', val: 'Worli' },
                      { label: 'Bandra West (Pali Hill)', val: 'Bandra West' },
                      { label: 'Juhu Beachfront', val: 'Juhu' },
                      { label: 'Lower Parel Towers', val: 'Lower Parel' },
                      { label: 'Malabar Hill & Walkeshwar', val: 'Malabar Hill' },
                      { label: 'Cuffe Parade & Colaba', val: 'Cuffe Parade' },
                    ].map((loc) => (
                      <button
                        key={loc.val}
                        type="button"
                        onClick={() => {
                          setSearchLocation(loc.val);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-3 sm:py-3.5 text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-200 flex items-center justify-between cursor-pointer rounded-xs ${
                          searchLocation === loc.val
                            ? 'bg-[#C5282F] text-white font-bold shadow-md'
                            : 'text-white/90 hover:bg-white/10 hover:text-white hover:pl-5'
                        }`}
                      >
                        <span>{loc.label}</span>
                        {searchLocation === loc.val && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. BHK (Custom Padded Dropdown) */}
              <div className="hero-dropdown-container lg:col-span-2 px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors relative group font-sans">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-extrabold text-white/80 mb-1 font-sans">
                  <BedDouble className="w-3.5 h-3.5 text-[#C5282F]" />
                  <span>Bedrooms</span>
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'bhk' ? null : 'bhk')}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none flex items-center justify-between cursor-pointer font-sans text-left"
                >
                  <span className="truncate">{searchBhk === 'Any' ? 'Any BHK' : searchBhk}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${openDropdown === 'bhk' ? 'rotate-180 text-[#C5282F]' : ''}`} />
                </button>

                {openDropdown === 'bhk' && (
                  <div
                    style={{ backgroundColor: '#16181C' }}
                    className="absolute top-[calc(100%+8px)] left-0 min-w-[280px] sm:min-w-[300px] bg-[#16181C] border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.8)] p-3 z-50 rounded-sm font-sans"
                  >
                    <div className="px-3.5 pt-1 pb-2.5 text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold border-b border-white/10 mb-2 flex items-center justify-between">
                      <span>Configuration</span>
                      <span className="text-[9px] text-[#C5282F] font-semibold">BHK</span>
                    </div>
                    {[
                      { label: 'Any Configuration', val: 'Any' },
                      { label: '3 BHK Residence', val: '3 BHK' },
                      { label: '4 BHK Sky Suite', val: '4 BHK' },
                      { label: '5 BHK Sky Mansion', val: '5 BHK' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          setSearchBhk(opt.val);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-3 sm:py-3.5 text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-200 flex items-center justify-between cursor-pointer rounded-xs ${
                          searchBhk === opt.val
                            ? 'bg-[#C5282F] text-white font-bold shadow-md'
                            : 'text-white/90 hover:bg-white/10 hover:text-white hover:pl-5'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {searchBhk === opt.val && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Budget (Single 2-Way Range Slider) */}
              <div className="hero-dropdown-container lg:col-span-3 px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors relative group font-sans">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-extrabold text-white/80 font-sans">
                    <IndianRupee className="w-3.5 h-3.5 text-[#C5282F]" />
                    <span>Budget Range</span>
                  </label>
                  <span className="text-xs font-sans font-bold text-[#C5282F]">
                    ₹{searchMinBudget} Cr – {searchMaxBudget >= 60 ? '₹60 Cr+' : `₹${searchMaxBudget} Cr`}
                  </span>
                </div>

                {/* Single 2-Way Slider Track with Dual Thumbs */}
                <div className="relative w-full h-5 flex items-center">
                  {/* Gray Background Track */}
                  <div className="absolute w-full h-1.5 bg-white/20 rounded-full" />
                  
                  {/* Red Active Range Bar between min and max */}
                  <div
                    className="absolute h-1.5 bg-[#C5282F] rounded-full pointer-events-none"
                    style={{
                      left: `${((searchMinBudget - 3) / (60 - 3)) * 100}%`,
                      width: `${((searchMaxBudget - searchMinBudget) / (60 - 3)) * 100}%`,
                    }}
                  />

                  {/* Min Value Thumb Slider */}
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={searchMinBudget}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), searchMaxBudget - 1);
                      setSearchMinBudget(val);
                    }}
                    aria-label="Minimum Budget"
                    className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-20 h-full m-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C5282F] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#C5282F] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                  />

                  {/* Max Value Thumb Slider */}
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={searchMaxBudget}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), searchMinBudget + 1);
                      setSearchMaxBudget(val);
                    }}
                    aria-label="Maximum Budget"
                    className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-30 h-full m-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C5282F] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#C5282F] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>

                <div className="flex justify-between text-[9px] text-white/50 mt-1 font-mono">
                  <span>₹3 Cr</span>
                  <span>₹60 Cr</span>
                </div>
              </div>

              {/* 4. Construction Status (Dropdown) */}
              <div className="hero-dropdown-container lg:col-span-2 px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors relative group font-sans">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-extrabold text-white/80 mb-1 font-sans">
                  <Building2 className="w-3.5 h-3.5 text-[#C5282F]" />
                  <span>Construction Status</span>
                </label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none flex items-center justify-between cursor-pointer font-sans text-left"
                >
                  <span className="truncate">{searchStatus === 'All' ? 'All Status' : searchStatus}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${openDropdown === 'status' ? 'rotate-180 text-[#C5282F]' : ''}`} />
                </button>

                {openDropdown === 'status' && (
                  <div
                    style={{ backgroundColor: '#16181C' }}
                    className="absolute top-[calc(100%+8px)] left-0 min-w-[280px] sm:min-w-[300px] bg-[#16181C] border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.8)] p-3 z-50 rounded-sm font-sans"
                  >
                    <div className="px-3.5 pt-1 pb-2.5 text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold border-b border-white/10 mb-2 flex items-center justify-between">
                      <span>Construction Status</span>
                      <span className="text-[9px] text-[#C5282F] font-semibold">Phase</span>
                    </div>
                    {[
                      { label: 'All Status', val: 'All' },
                      { label: 'Resale', val: 'Resale' },
                      { label: 'Pre Launch', val: 'Pre Launch' },
                      { label: 'Under Construction', val: 'Under Construction' },
                      { label: 'Ready to Move In', val: 'Ready to Move In' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          setSearchStatus(opt.val);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-3 sm:py-3.5 text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-200 flex items-center justify-between cursor-pointer rounded-xs ${
                          searchStatus === opt.val
                            ? 'bg-[#C5282F] text-white font-bold shadow-md'
                            : 'text-white/90 hover:bg-white/10 hover:text-white hover:pl-5'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {searchStatus === opt.val && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Search Button */}
              <div className="lg:col-span-2 p-1">
                <button
                  type="submit"
                  className="w-full h-11 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-[0.2em] font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <Search className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>SEARCH</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Bar: Indicators & Subtle Scroll Cue */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/* Slide Indicator Dots (Visual Only) */}
        <div className="flex items-center gap-3 mb-4 pointer-events-auto" aria-label="Hero Slide Progress">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 transition-all duration-500 rounded-full ${
                currentSlide === idx ? 'w-8 bg-[#C5282F]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Scroll Cue (Fades in when unlocked or returning visit) */}
        <div
          className={`flex flex-col items-center text-white/70 transition-opacity duration-700 ${
            hasUnlocked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium mb-1">
            Scroll To Discover
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

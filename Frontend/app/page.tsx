'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { HeroCarousel } from '@/components/hero/HeroCarousel';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PrivateOpportunities } from '@/components/property/PrivateOpportunities';
import { MarketIntelligenceSection } from '@/components/home/MarketIntelligenceSection';
import { WhyParmar } from '@/components/home/WhyParmar';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';
import { PROPERTIES } from '@/data/properties';
import { HOME_PAGE_CONTENT } from '@/data/content/home.content';

export default function HomePage() {
  const { featuredProperties: featContent, locationSection: locContent } = HOME_PAGE_CONTENT;

  // Curated premier featured properties for home page showcase
  const featuredProperties = PROPERTIES.slice(0, featContent.maxDisplayCount || 6);

  return (
    <div className="w-full relative bg-[#EDEEE9] text-[#15181A] pt-[68px] sm:pt-[70px] md:pt-[72px]">
      {/* Scroll Progress Indicator */}
      <ScrollProgressBar />

      {/* 1. HERO SECTION & SEARCH CONSOLE */}
      <div id="hero">
        <HeroCarousel />
      </div>

      {/* 2. FEATURED PROPERTIES */}
      <section id={featContent.sectionId || 'properties'} className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-6 border-b border-[#CFD1CA] gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#15181A]">
                {featContent.heading}
              </h2>
              <p className="text-xs sm:text-sm text-[#5B605F] mt-2 font-sans">
                {featContent.subheading}
              </p>
            </div>

            <Link
              href={featContent.viewAllButton.link}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-wider font-semibold transition-colors shrink-0"
            >
              <span>{featContent.viewAllButton.text}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Featured Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProperties.map((property, idx) => (
            <ScrollReveal key={property.id} animation="fade-up" delay={(idx % 3) * 120}>
              <PropertyCard property={property} />
            </ScrollReveal>
          ))}
        </div>

        {/* 3. EXPLORE PROPERTIES (FILTERED BY LOCATION) */}
        <div id={locContent.sectionId || 'locations'} className="mt-24 pt-16 border-t border-[#CFD1CA]">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#CFD1CA] gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#C5282F] mb-1 block font-sans">
                  {locContent.tag}
                </span>
                <h3 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#15181A]">
                  {locContent.heading}
                </h3>
              </div>
              <Link
                href={locContent.allLocationsLink.link}
                className="text-xs uppercase tracking-wider text-[#5B605F] hover:text-[#C5282F] font-bold inline-flex items-center gap-1.5 transition-colors font-sans"
              >
                <span>{locContent.allLocationsLink.text}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>

          {/* 4 Location Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {locContent.cards.map((loc, idx) => (
              <ScrollReveal key={loc.slug} animation="fade-up" delay={idx * 100}>
                <div className="group bg-[#F7F7F4] border border-[#CFD1CA] hover:border-[#15181A] transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between h-full">
                  <div>
                    {/* Location Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-[#15181A]">
                      <Image
                        src={loc.image}
                        alt={loc.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] uppercase tracking-wider text-white/70 block font-sans font-semibold">
                          {loc.tagline}
                        </span>
                        <h4 className="font-sans text-xl font-extrabold tracking-tight text-white drop-shadow">
                          {loc.name}
                        </h4>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 flex items-center justify-between text-xs text-[#5B605F] border-b border-[#CFD1CA]/60">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#C5282F]" />
                        <span>Mumbai</span>
                      </span>
                      <span className="font-semibold text-[#15181A]">{loc.rate}</span>
                    </div>
                  </div>

                  {/* Explore Properties Button */}
                  <div className="p-4 pt-3">
                    <Link
                      href={`/locations/${loc.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#C5282F] hover:bg-[#A31D23] text-white text-[11px] uppercase tracking-[0.15em] font-semibold transition-all duration-200 shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>{loc.buttonText || 'EXPLORE PROPERTIES'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Clickable Future Locations Bar */}
          <Link
            href={locContent.futureLocationsStrip.link}
            className="mt-8 py-3.5 px-6 bg-[#F7F7F4] border border-[#CFD1CA] hover:border-[#15181A] hover:bg-white transition-all flex items-center justify-between gap-3 text-xs group cursor-pointer shadow-2xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5282F]">
                {locContent.futureLocationsStrip.badge}
              </span>
              <span className="text-[#5B605F] font-medium group-hover:text-[#15181A] transition-colors">
                {locContent.futureLocationsStrip.description}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C5282F] shrink-0">
              <span>{locContent.futureLocationsStrip.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. PRIVATE OPPORTUNITIES */}
      <div id="private-opportunities">
        <PrivateOpportunities minimal={true} />
      </div>

      {/* 5. WHY PARMAR PROPERTIES */}
      <div id="why-parmar">
        <WhyParmar />
      </div>

      {/* 6. MARKET INTELLIGENCE */}
      <div id="market-intelligence">
        <MarketIntelligenceSection />
      </div>
    </div>
  );
}

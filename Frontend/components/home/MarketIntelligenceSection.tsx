'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, TrendingUp, Compass, Globe, FileText } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export interface MarketInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  readTime: string;
  tag: string;
  icon: React.ElementType;
}

export const FEATURED_INSIGHTS: MarketInsight[] = [
  {
    id: 'worli-guide-2026',
    category: 'WORLI PROPERTY GUIDE 2026',
    title: 'What Rs. 10–25 Cr buys in Worli today.',
    description: 'Neighbourhood, product, price band and buyer-profile context across Sea Face and high-rise developments.',
    readTime: '4 min read',
    tag: 'Price Analysis',
    icon: TrendingUp,
  },
  {
    id: 'mahalaxmi-vs-worli',
    category: 'LOCATION COMPARISON',
    title: 'Mahalaxmi vs Worli',
    description: "Understanding two of South Mumbai's evolving luxury corridors, racecourse vistas, and coastal connectivity.",
    readTime: '5 min read',
    tag: 'Macro Trends',
    icon: Compass,
  },
  {
    id: 'buying-penthouse-mumbai',
    category: 'BUYER GUIDE',
    title: 'Buying a Penthouse in Mumbai',
    description: 'What buyers should evaluate beyond the view: private elevators, structural terrace loads, and wind engineering.',
    readTime: '6 min read',
    tag: 'Architecture & Law',
    icon: BookOpen,
  },
  {
    id: 'nri-mumbai-property',
    category: 'NRI GUIDE',
    title: 'Buying Mumbai property from overseas',
    description: 'A practical guide to search, compare, repatriate funds, and transact under FEMA & RBI guidelines.',
    readTime: '7 min read',
    tag: 'Cross-Border Advisory',
    icon: Globe,
  },
];

import { HOME_PAGE_CONTENT } from '@/data/content/home.content';

export function MarketIntelligenceSection() {
  const miContent = HOME_PAGE_CONTENT.marketIntelligence;

  return (
    <section id={miContent.sectionId || 'market-intelligence'} className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#CFD1CA]">
      <ScrollReveal animation="fade-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#CFD1CA] gap-4">
          <div className="max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#C5282F] mb-2 block">
              {miContent.badge}
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-[#15181A] tracking-tight">
              {miContent.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B605F] mt-2 font-sans leading-relaxed">
              {miContent.subheading}
            </p>
          </div>

          <Link
            href={miContent.viewAllLink.link}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#15181A] hover:bg-[#C5282F] text-white text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 self-start md:self-end shadow-xs group"
          >
            <span>{miContent.viewAllLink.text}</span>
          </Link>
        </div>
      </ScrollReveal>

      {/* 4 Square-styled Minimalist Editorial Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {FEATURED_INSIGHTS.map((insight, idx) => {
          return (
            <ScrollReveal key={insight.id} animation="fade-up" delay={idx * 100}>
              <Link
                href={`/market-intelligence/${insight.id}`}
                className="group block bg-[#F7F7F4] border border-[#CFD1CA] p-8 sm:p-10 hover:border-[#15181A] hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md relative flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  {/* Category in small tracking uppercase */}
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#5B605F] group-hover:text-[#C5282F] transition-colors block mb-3 font-sans">
                    {insight.category}
                  </span>

                  {/* Title in strong bold styling */}
                  <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#15181A] tracking-tight mb-3 leading-snug group-hover:text-[#C5282F] transition-colors">
                    {insight.title}
                  </h3>

                  {/* Contextual Description */}
                  <p className="text-xs sm:text-[13px] text-[#5B605F] leading-relaxed font-sans">
                    {insight.description}
                  </p>
                </div>

                {/* Footer bar */}
                <div className="pt-6 mt-6 border-t border-[#CFD1CA]/60 flex items-center justify-between text-xs text-[#5B605F]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#15181A] font-medium">
                    {insight.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15181A] group-hover:text-[#C5282F] transition-colors">
                    <span>Read Detailed Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Direct button at bottom as well */}
      <div className="mt-10 pt-6 flex justify-start">
        <Link
          href="/market-intelligence"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#15181A] hover:bg-[#C5282F] text-white text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 shadow-xs group"
        >
          <span>VIEW ALL INSIGHTS -&gt;</span>
        </Link>
      </div>
    </section>
  );
}

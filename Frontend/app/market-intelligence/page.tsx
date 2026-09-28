'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, TrendingUp, Compass, Globe, FileText, CheckCircle2, ShieldAlert, Sparkles, Download, Mail } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { INSIGHTS_PAGE_CONTENT } from '@/data/content/insights.content';

interface ArticleInsight {
  id: string;
  category: string;
  categorySlug: 'location' | 'price' | 'buyer' | 'nri';
  title: string;
  description: string;
  keyPoints: string[];
  readTime: string;
  tag: string;
  date: string;
}

const ALL_INSIGHTS: ArticleInsight[] = [
  {
    id: 'worli-guide-2026',
    category: 'WORLI PROPERTY GUIDE 2026',
    categorySlug: 'location',
    title: 'What Rs. 10–25 Cr buys in Worli today.',
    description: 'Neighbourhood, product, price band and buyer-profile context across Sea Face and high-rise developments.',
    keyPoints: [
      '3 to 4 BHK configurations in standalone boutique towers vs multi-acre integrated developments.',
      'Price realization: Sea-facing premiums range from 20% to 35% over racecourse and city view residences.',
      'Key corridors examined: Worli Sea Face, Dr. Annie Besant Road, and Pochkhanawala luxury belt.',
      'Target buyer profile: Generational family offices, senior financial partners, and maritime investors.',
    ],
    readTime: '4 min read',
    tag: 'Price Analysis',
    date: 'Q1 2026 Benchmark',
  },
  {
    id: 'mahalaxmi-vs-worli',
    category: 'LOCATION COMPARISON',
    categorySlug: 'location',
    title: 'Mahalaxmi vs Worli',
    description: "Understanding two of South Mumbai's evolving luxury corridors, racecourse vistas, and coastal connectivity.",
    keyPoints: [
      'Topography & Views: Mahalaxmi Racecourse emerald vistas vs Worli Arabian Sea unbroken sunset horizons.',
      'Floorplate density: Comparison between expansive 5,000+ sq.ft full-floor plates and ultra-tall sky villas.',
      'Infrastructure catalysts: Coastal Road interchanges, Sea Link speedways, and metro feeder linkages.',
      'Long-term capital stability: Historical 10-year appreciation and rental yield profiles for both enclaves.',
    ],
    readTime: '5 min read',
    tag: 'Macro Trends',
    date: 'Market Comparative',
  },
  {
    id: 'buying-penthouse-mumbai',
    category: 'BUYER GUIDE',
    categorySlug: 'buyer',
    title: 'Buying a Penthouse in Mumbai',
    description: 'What buyers should evaluate beyond the view: private elevators, structural terrace loads, and wind engineering.',
    keyPoints: [
      'Terrace rights & demarcation: Verifying registered super-exclusive terrace titles vs common society areas.',
      'Acoustic & wind engineering: Curtain wall structural glass specifications at 40+ storey elevations.',
      'Private vertical transit: High-speed biometric elevator zoning, lobby isolation, and service access routes.',
      'Private pool & load allowances: Structural column alignment for rooftop jacuzzis and landscaped sundecks.',
    ],
    readTime: '6 min read',
    tag: 'Architecture & Law',
    date: 'Executive Advisory',
  },
  {
    id: 'nri-mumbai-property',
    category: 'NRI GUIDE',
    categorySlug: 'nri',
    title: 'Buying Mumbai property from overseas',
    description: 'A practical guide to search, compare, repatriate funds, and transact under FEMA & RBI guidelines.',
    keyPoints: [
      'NRE / NRO banking pathways: Inward remittance verification, FIRC documentation, and capital routing.',
      'Power of Attorney protocols: Consular apostille, local adjudication, and electronic execution compliance.',
      'TDS & Repatriation: Section 195 withholding tax mechanisms and capital gains repatriation under Form 15CA/CB.',
      'Remote inspection & advisory: Independent third-party structural audit and verified digital due diligence.',
    ],
    readTime: '7 min read',
    tag: 'Cross-Border Advisory',
    date: 'Regulatory Playbook',
  },
  {
    id: 'bandra-west-micromarket',
    category: 'BANDRA WEST PROPERTY REPORT',
    categorySlug: 'location',
    title: 'Pali Hill vs. Bandstand: Capital Velocity',
    description: 'Micro-market evaluation of Bandra West’s heritage canopy enclaves against waterfront landmark towers.',
    keyPoints: [
      'Pali Hill low-density exclusivity: Why bungalows and boutique towers trade at a scarcity premium.',
      'Bandstand coastal strip: High-demand residential portfolios commanding ₹1.10L+ per sq.ft.',
      'Tenant profile & yields: Consulate executives, creative agency founders, and high-growth entrepreneurs.',
    ],
    readTime: '5 min read',
    tag: 'Micro-Market Intelligence',
    date: 'Strategic Report',
  },
  {
    id: 'capital-gains-structuring',
    category: 'TAX & STRUCTURING GUIDE',
    categorySlug: 'price',
    title: 'Section 54 Reinvestment & Luxury Asset Allocation',
    description: 'Navigating long-term capital gain exemptions when transitioning from commercial or industrial assets to luxury residential.',
    keyPoints: [
      'Two-year acquisition timeline under Section 54/54F for high-net-worth real estate buyers.',
      'Multi-unit consolidation and joint ownership structuring for estate planning.',
      'Capital Gains Account Scheme (CGAS) parking strategies ahead of property closings.',
    ],
    readTime: '6 min read',
    tag: 'Wealth Structuring',
    date: 'Legal & Tax Brief',
  },
];

export default function MarketIntelligencePage() {
  const [activeModalInsight, setActiveModalInsight] = useState<ArticleInsight | null>(null);
  const filteredInsights = ALL_INSIGHTS;

  return (
    <div className="w-full min-h-screen bg-[#EDEEE9] text-[#15181A] pt-24 font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-[#15181A] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#CFD1CA] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(#CFD1CA_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 mb-6 font-sans">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#C5282F] font-semibold">Market Intelligence</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-[10px] uppercase tracking-[0.25em] font-bold text-[#C5282F] mb-4">
              <FileText className="w-3.5 h-3.5 text-[#C5282F]" />
              <span>{INSIGHTS_PAGE_CONTENT.header.badge}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight mb-4">
              {INSIGHTS_PAGE_CONTENT.header.title}
            </h1>
            <p className="text-sm sm:text-base text-white/80 font-sans leading-relaxed">
              {INSIGHTS_PAGE_CONTENT.header.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Main Square-Box Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredInsights.map((insight, idx) => (
            <ScrollReveal key={insight.id} animation="fade-up" delay={idx * 80}>
              <div
                id={insight.id}
                className="group bg-[#F7F7F4] border border-[#CFD1CA] p-8 sm:p-10 hover:border-[#15181A] hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between min-h-[300px]"
              >
                <div>
                  {/* Category in small tracking uppercase */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#CFD1CA] mb-5">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#5B605F] group-hover:text-[#C5282F] transition-colors">
                      {insight.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#5B605F]">
                      {insight.date}
                    </span>
                  </div>

                  {/* Title in strong bold styling */}
                  <Link href={`/market-intelligence/${insight.id}`}>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#15181A] tracking-tight mb-3 leading-snug hover:text-[#C5282F] transition-colors cursor-pointer">
                      {insight.title}
                    </h2>
                  </Link>

                  {/* Contextual Description */}
                  <p className="text-xs sm:text-[13px] text-[#5B605F] leading-relaxed font-sans mb-6">
                    {insight.description}
                  </p>

                  {/* Key takeaways bullet points in the square box */}
                  <div className="space-y-2 pt-2 border-t border-[#CFD1CA]/40 mb-6">
                    {insight.keyPoints.slice(0, 3).map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-[#15181A]/85">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5282F] mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-4 border-t border-[#CFD1CA] flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5B605F]">
                    {insight.readTime}
                  </span>
                  <Link
                    href={`/market-intelligence/${insight.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15181A] hover:bg-[#C5282F] text-white text-[11px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  >
                    <span>Read Detailed Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Advisory Consultation Box */}
        <div className="mt-16 bg-[#15181A] text-white p-8 sm:p-12 border border-[#CFD1CA] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#C5282F] block mb-2">
              BESPOKE ADVISORY &amp; VALUATION MEMORANDUM
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-white mb-2">
              Require Confidential Transaction Guidance?
            </h3>
            <p className="text-xs sm:text-sm text-white/70 font-sans leading-relaxed">
              Our principal advisors formulate customized comparative yield models, title scrutiny, and off-market intelligence briefs for family offices and institutional buyers.
            </p>
          </div>

          <Link
            href="/#contact"
            className="px-6 py-3.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <span>Request Research Brief</span>
          </Link>
        </div>
      </section>

      {/* Modal for Reading Full Insight */}
      {activeModalInsight && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full border border-[#CFD1CA] p-8 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFD1CA] mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#C5282F]">
                {activeModalInsight.category}
              </span>
              <button
                onClick={() => setActiveModalInsight(null)}
                className="text-xs font-semibold uppercase tracking-wider text-[#5B605F] hover:text-[#15181A] px-2 py-1 bg-[#EDEEE9]"
              >
                Close &times;
              </button>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#15181A] mb-4">
              {activeModalInsight.title}
            </h2>

            <p className="text-sm text-[#5B605F] leading-relaxed mb-6 font-sans">
              {activeModalInsight.description}
            </p>

            <div className="p-4 bg-[#F7F7F4] border border-[#CFD1CA] mb-6">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#15181A] mb-3">
                Executive Takeaways &amp; Diligence Points
              </h4>
              <ul className="space-y-2.5 text-xs text-[#5B605F]">
                {activeModalInsight.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5282F] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#CFD1CA] flex items-center justify-between">
              <span className="text-xs text-[#5B605F] font-mono">{activeModalInsight.date}</span>
              <Link
                href="/#contact"
                onClick={() => setActiveModalInsight(null)}
                className="px-5 py-2.5 bg-[#15181A] hover:bg-[#C5282F] text-white text-xs uppercase tracking-wider font-semibold"
              >
                Enquire on this Topic
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

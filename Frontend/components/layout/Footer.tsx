import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#15181A] text-white border-t border-[#23272A] py-14 text-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-10 border-b border-[#23272A] gap-6">
          <div>
            <span className="font-serif text-2xl tracking-[0.2em] uppercase font-light text-white block">
              PARMAR PROPERTIES
            </span>
            <p className="text-xs text-[#CFD1CA] tracking-wider uppercase mt-1">
              Mumbai &bull; Prime Residential Real Estate
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a
              href="https://www.parmarproperties.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-wider font-semibold transition-colors"
            >
              <span>Visit Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-1.5 px-3 py-2 text-[#CFD1CA] border border-[#33383D]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5282F]" />
              <span>MahaRERA: A51900018442</span>
            </div>
          </div>
        </div>

        {/* Clean, Simple 3-Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-b border-[#23272A] text-xs">
          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-3">
              Navigation
            </h4>
            <div className="flex flex-col space-y-2 text-[#CFD1CA]">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/properties?tab=buy" className="hover:text-white transition-colors">Buy</Link>
              <Link href="/properties?tab=new-launches" className="hover:text-white transition-colors">New Launches</Link>
              <Link href="/properties?tab=luxury-collection" className="hover:text-white transition-colors">Luxury Collection</Link>
              <Link href="/commercials" className="hover:text-white transition-colors">Commercials</Link>
              <Link href="/locations" className="hover:text-white transition-colors">Location</Link>
              <Link href="/market-intelligence" className="hover:text-white transition-colors">Insights</Link>
            </div>
          </div>

          {/* Office Address */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-3">
              Office
            </h4>
            <div className="space-y-1.5 text-[#CFD1CA]">
              <p className="text-white font-medium">Parmar Properties</p>
              <p>Peninsula Center, Lower Parel</p>
              <p>Mumbai, Maharashtra 400013</p>
            </div>
          </div>

          {/* Direct Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-3">
              Contact
            </h4>
            <div className="space-y-2 text-[#CFD1CA]">
              <p>
                <a href="tel:+912249887700" className="hover:text-white transition-colors">
                  +91 (022) 4988 7700
                </a>
              </p>
              <p>
                <a href="mailto:contact@parmarproperties.com" className="hover:text-white transition-colors">
                  contact@parmarproperties.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5B605F]">
          <p>&copy; {new Date().getFullYear()} Parmar Properties. All rights reserved.</p>
          <p>MahaRERA Registration No. A51900018442</p>
        </div>
      </div>
    </footer>
  );
};

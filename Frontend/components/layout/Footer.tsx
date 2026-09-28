import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#15181A] text-white border-t border-[#23272A] py-14 text-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-10 border-b border-[#23272A] gap-6">
          <div>
            {/* Highlighted PARMAR PROPERTIES Brand */}
            <div className="flex items-center gap-3">
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.2em] uppercase font-bold text-white block">
                <span className="text-[#C5282F] font-black drop-shadow-sm">PARMAR</span> PROPERTIES
              </span>
              <span className="px-2.5 py-0.5 bg-[#C5282F] text-white text-[10px] uppercase tracking-[0.2em] font-extrabold shadow-sm">
                EST. 1981
              </span>
            </div>
            <div className="h-0.5 w-28 bg-[#C5282F] mt-2 mb-2" />
            <p className="text-xs text-[#CFD1CA] tracking-wider uppercase font-medium">
              Mumbai &bull; Prime Residential Real Estate Advisory
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a
              href="https://www.parmarproperties.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm"
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
              <Link href="/" className="hover:text-[#C5282F] transition-colors">Home</Link>
              <Link href="/properties?tab=buy" className="hover:text-[#C5282F] transition-colors">Buy</Link>
              <Link href="/properties?tab=new-launches" className="hover:text-[#C5282F] transition-colors">New Launches</Link>
              <Link href="/properties?tab=luxury-collection" className="hover:text-[#C5282F] transition-colors">Luxury Collection</Link>
              <Link href="/commercials" className="hover:text-[#C5282F] transition-colors">Commercials</Link>
              <Link href="/locations" className="hover:text-[#C5282F] transition-colors">Location</Link>
              <Link href="/market-intelligence" className="hover:text-[#C5282F] transition-colors">Insights</Link>
            </div>
          </div>

          {/* Office Address */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-3">
              Office
            </h4>
            <div className="space-y-1.5 text-[#CFD1CA]">
              <p className="text-white font-bold tracking-wide">
                <span className="text-[#C5282F]">PARMAR</span> PROPERTIES
              </p>
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5282F] shrink-0 mt-0.5" />
                <span>Peninsula Center, 208, Doctor SS Rao Marg, Parel</span>
              </p>
              <p className="pl-5 text-white/70">Mumbai, Maharashtra 400012</p>
              <p className="pl-5 text-[11px] text-white/50">Hours: Mon – Sun: 10:00 AM – 6:30 PM IST</p>
            </div>
          </div>

          {/* Direct Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white mb-3">
              Contact
            </h4>
            <div className="space-y-2.5 text-[#CFD1CA]">
              <p>
                <a
                  href="tel:+912266669733"
                  className="hover:text-white transition-colors flex items-center gap-2 font-semibold text-sm text-white"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C5282F]" />
                  <span>+91 (022) 6666 9733</span>
                </a>
              </p>
              <p>
                <a
                  href="mailto:contact@parmarproperties.com"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#C5282F]" />
                  <span>contact@parmarproperties.com</span>
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5B605F]">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <strong className="text-white font-bold tracking-wider">
              <span className="text-[#C5282F]">PARMAR</span> PROPERTIES
            </strong>
            . All rights reserved.
          </p>
          <p>MahaRERA Registration No. A51900018442</p>
        </div>
      </div>
    </footer>
  );
};

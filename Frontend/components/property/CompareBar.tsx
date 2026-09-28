'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { useCompareStore } from '@/store/compare';
import { PROPERTIES } from '@/data/properties';

export const CompareBar: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const compareIds = useCompareStore((s) => s.compareIds);
  const removeFromCompare = useCompareStore((s) => s.removeFromCompare);
  const clearCompare = useCompareStore((s) => s.clearCompare);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || compareIds.length === 0) {
    return null;
  }

  const comparedProperties = PROPERTIES.filter((p) => compareIds.includes(p.id));

  const handleScrollToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('compare');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/compare';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#F7F7F4]/95 backdrop-blur-md border-t border-[#CFD1CA] shadow-2xl p-4 animate-fadeIn transition-transform duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#15181A] text-white flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#15181A]">
              Compare Residences ({comparedProperties.length}/4)
            </h4>
            <p className="text-[11px] text-[#5B605F]">
              Side-by-side analysis of pricing, carpet area, and specifications
            </p>
          </div>
        </div>

        {/* Middle: Selected Thumbnails */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-xl py-1">
          {comparedProperties.map((prop) => (
            <div
              key={prop.id}
              className="flex items-center gap-2 bg-[#EDEEE9] border border-[#CFD1CA] p-1.5 pr-2 rounded-none shadow-xs shrink-0"
            >
              <div className="relative w-8 h-8 overflow-hidden bg-[#CFD1CA] shrink-0">
                <Image
                  src={prop.coverImage}
                  alt={prop.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-xs font-serif font-medium text-[#15181A] truncate max-w-[100px]">
                  {prop.title}
                </p>
                <p className="text-[10px] text-[#15181A] font-semibold">
                  {prop.priceFormatted}
                </p>
              </div>
              <button
                onClick={() => removeFromCompare(prop.id)}
                className="text-[#5B605F] hover:text-[#C5282F] p-0.5 ml-1"
                aria-label={`Remove ${prop.title} from compare`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={clearCompare}
            className="text-xs uppercase tracking-wider text-[#5B605F] hover:text-[#C5282F] font-medium transition-colors"
          >
            Clear
          </button>
          <a
            href="#compare"
            onClick={handleScrollToCompare}
            className="px-5 py-2.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Compare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

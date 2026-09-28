'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Trash2,
  Lock,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { useSavedStore } from '@/store/saved';
import { useAuthStore } from '@/store/auth';
import { PROPERTIES } from '@/data/properties';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CompareBar } from '@/components/property/CompareBar';
import { SAVED_PAGE_CONTENT } from '@/data/content/saved.content';

export default function SavedPage() {
  const { header, emptyState } = SAVED_PAGE_CONTENT;
  const [mounted, setMounted] = useState(false);
  const savedIds = useSavedStore((s) => s.savedIds);
  const clearSaved = useSavedStore((s) => s.clearSaved);
  const { isLoggedIn, user, login, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const savedProperties = mounted
    ? PROPERTIES.filter((p) => savedIds.includes(p.id))
    : [];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen bg-[#EDEEE9] text-[#15181A]">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#CFD1CA]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#5B605F] font-semibold mb-2">
            <Link href="/" className="hover:underline">Home</Link> &bull; Client Portfolio
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[#15181A]">
            {header.title}
          </h1>
          <p className="text-sm text-[#5B605F] mt-1 font-sans">
            {header.subtitle}
          </p>
        </div>

        {mounted && isLoggedIn && savedProperties.length > 0 && (
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={clearSaved}
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#C5282F] hover:text-[#A31D23] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{header.clearButtonText}</span>
            </button>
          </div>
        )}
      </div>

      {/* Auth Gated View */}
      {mounted && !isLoggedIn ? (
        <div className="max-w-xl mx-auto bg-[#F7F7F4] border border-[#CFD1CA] p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-[#EDEEE9] border border-[#CFD1CA] flex items-center justify-center text-[#15181A] mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-light text-[#15181A] mb-2">
            Client Authentication Required
          </h2>
          <p className="text-xs text-[#5B605F] max-w-sm mx-auto mb-6 leading-relaxed font-sans">
            Your saved properties portfolio is secured. Sign in with your client profile to access and manage your curated Mumbai residences.
          </p>
          <button
            onClick={() => login('client@parmargroup.com', 'Aditya Parmar')}
            className="px-8 py-3 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-widest font-semibold transition-colors inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In as Client</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Active Client Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#F7F7F4] border border-[#CFD1CA] p-4 mb-8">
            <div className="flex items-center gap-2 text-xs text-[#15181A]">
              <span className="font-semibold">Authenticated Client:</span>
              <span className="text-[#5B605F]">{user?.name} ({user?.email})</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#5B605F]">{savedProperties.length} residences saved</span>
              <button
                onClick={() => logout()}
                className="text-[#C5282F] hover:text-[#A31D23] font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {savedProperties.length === 0 ? (
            <div className="text-center py-20 bg-[#F7F7F4] border border-[#CFD1CA] p-8">
              <Bookmark className="w-10 h-10 text-[#5B605F] mx-auto mb-3 opacity-40" />
              <h2 className="font-serif text-2xl text-[#15181A] mb-1 font-light">
                {emptyState.heading}
              </h2>
              <p className="text-xs text-[#5B605F] max-w-md mx-auto mb-6">
                {emptyState.subtext}
              </p>
              <Link
                href={emptyState.browseButtonLink || '/properties?tab=buy'}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-widest font-semibold"
              >
                <span>{emptyState.browseButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      )}

      <CompareBar />
    </div>
  );
}

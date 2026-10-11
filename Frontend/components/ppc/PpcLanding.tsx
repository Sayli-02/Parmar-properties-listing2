'use client';

import React, { useState } from 'react';
import { Phone, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { Property } from '@/types/property';
import { submitLead } from '@/lib/supabase/leads';
import { withOnwards } from '@/lib/price';

const PHONE_DISPLAY = '+91 (022) 6666 9733';
const PHONE_TEL = 'tel:+912266669733';
const PLACEHOLDER = '/placeholder.png';

/** Fixed-layout landing page for Google PPC traffic: one property, one call to action. */
export function PpcLanding({ property }: { property: Property }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const hero = property.images?.find((i) => i && i !== PLACEHOLDER);
  const variants = property.layoutVariants ?? [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    // Keep ad attribution (utm_*, gclid) with the lead.
    const tracking = window.location.search.replace(/^\?/, '');
    const res = await submitLead({
      fullName: form.name,
      phone: form.phone,
      email: form.email,
      sourceSlug: 'google_ppc_landing',
      propertyId: property.id,
      message: `PPC landing enquiry for ${property.title}${tracking ? ` | ${tracking}` : ''}`,
    });
    setState(res.success ? 'done' : 'error');
  }

  const facts = (
    [
      ['Location', [property.subLocation, property.location].filter(Boolean).join(', ')],
      ['Status', property.possession + (property.possessionDate ? ` · ${property.possessionDate}` : '')],
      ['Type', property.propertyType],
      ['Configurations', property.bhk],
      ['MahaRERA', property.reraId],
    ] as [string, string][]
  ).filter(([, v]) => v);

  return (
    <div className="bg-[#EDEEE9] text-[#15181A] font-sans min-h-screen pb-20 md:pb-0">
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 bg-white border-b border-[#CFD1CA]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_without_bg.png" alt="Parmar Properties" className="h-9 w-auto" />
        <a href={PHONE_TEL} className="inline-flex items-center gap-2 text-sm font-semibold text-[#C5282F]">
          <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
        </a>
      </header>

      <section
        className="relative text-white px-4 sm:px-8 py-16 sm:py-24 bg-[#15181A] bg-cover bg-center"
        style={
          hero
            ? { backgroundImage: `linear-gradient(rgba(21,24,26,.55),rgba(21,24,26,.75)), url(${hero})` }
            : undefined
        }
      >
        <div className="max-w-5xl mx-auto">
          <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/80 mb-3">
            <MapPin className="w-3.5 h-3.5" /> {property.location}
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-light">{property.title}</h1>
          {property.tagline ? <p className="mt-3 text-lg text-white/85 max-w-2xl">{property.tagline}</p> : null}
          <p className="mt-6 text-2xl sm:text-3xl font-bold">{withOnwards(property.priceFormatted)}</p>
          <a
            href="#enquire"
            className="mt-8 inline-block px-8 py-3.5 bg-[#C5282F] hover:bg-[#A31D23] text-white text-xs uppercase tracking-widest font-semibold"
          >
            Request private viewing
          </a>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 grid gap-10 md:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#CFD1CA] border border-[#CFD1CA]">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-[#F7F7F4] p-4">
                <span className="block text-[10px] uppercase tracking-wider text-[#5B605F]">{k}</span>
                <span className="text-sm font-semibold break-words">{v}</span>
              </div>
            ))}
          </section>

          {property.description ? (
            <section>
              <h2 className="font-serif text-2xl mb-3">Overview</h2>
              <p className="text-sm leading-relaxed text-[#3b403f]">{property.description}</p>
            </section>
          ) : null}

          {variants.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl mb-3">Residences</h2>
              <div className="overflow-x-auto border border-[#CFD1CA] bg-[#F7F7F4]">
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-[#5B605F]">
                    <tr>
                      <th className="p-3">Residence</th>
                      <th className="p-3">Carpet area (sq.ft)</th>
                      <th className="p-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={`${v.id}-${i}`} className="border-t border-[#CFD1CA]">
                        <td className="p-3 font-semibold">{v.title}</td>
                        <td className="p-3">{v.area}</td>
                        <td className="p-3">{withOnwards(v.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {property.highlights.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl mb-3">Highlights</h2>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {property.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5282F] shrink-0 mt-0.5" /> {h}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {property.amenities.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl mb-3">Amenities</h2>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {property.amenities.map((a) => (
                  <li key={a} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C5282F] shrink-0 mt-0.5" /> {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside id="enquire" className="md:sticky md:top-6 self-start bg-[#F7F7F4] border border-[#CFD1CA] p-5">
          <h2 className="font-serif text-2xl">Request a private viewing</h2>
          <p className="text-xs text-[#5B605F] mt-1 mb-4">Our advisor will call you back with current availability.</p>
          {state === 'done' ? (
            <p className="text-sm font-semibold text-emerald-700 flex gap-2">
              <ShieldCheck className="w-5 h-5" /> Thank you. We will call you shortly.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="w-full p-2.5 border border-[#CFD1CA] bg-white text-sm"
              />
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Mobile number"
                className="w-full p-2.5 border border-[#CFD1CA] bg-white text-sm"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email (optional)"
                className="w-full p-2.5 border border-[#CFD1CA] bg-white text-sm"
              />
              <button
                disabled={state === 'sending'}
                className="w-full py-3 bg-[#C5282F] hover:bg-[#A31D23] disabled:opacity-60 text-white text-xs uppercase tracking-widest font-semibold"
              >
                {state === 'sending' ? 'Sending…' : 'Request callback'}
              </button>
              {state === 'error' ? (
                <p className="text-xs text-[#C5282F]">Could not send. Please call {PHONE_DISPLAY}.</p>
              ) : null}
            </form>
          )}
        </aside>
      </div>

      <footer className="px-4 sm:px-8 pb-10 text-[11px] text-[#5B605F] max-w-5xl mx-auto">
        Prices, areas and availability are indicative and subject to change. Please verify project registration on the
        MahaRERA website. Parmar Properties · MahaRERA A51900018442.
      </footer>

      <a
        href={PHONE_TEL}
        className="md:hidden fixed bottom-0 inset-x-0 z-20 flex items-center justify-center gap-2 py-3.5 bg-[#C5282F] text-white text-sm font-semibold"
      >
        <Phone className="w-4 h-4" /> Call {PHONE_DISPLAY}
      </a>
    </div>
  );
}

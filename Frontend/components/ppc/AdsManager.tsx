'use client';

import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import type { Property } from '@/types/property';
import { fetchPublishedProperties } from '@/lib/supabase/properties';

// Google fills these ValueTrack placeholders in at click time.
const VALUETRACK = 'utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CFD1CA] bg-white hover:bg-[#EDEEE9] text-xs font-semibold"
    >
      {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {label}
    </button>
  );
}

/** Builds one Google Ads final URL per published property. Read-only: it saves nothing. */
export function AdsManager() {
  const [domain, setDomain] = useState('https://parmarproperties.in');
  const [campaign, setCampaign] = useState('');
  const [properties, setProperties] = useState<Property[] | null>(null);

  useEffect(() => {
    fetchPublishedProperties().then(setProperties);
  }, []);

  const base = domain.trim().replace(/\/+$/, '');
  const suffix = campaign.trim()
    ? VALUETRACK.replace('{campaignid}', encodeURIComponent(campaign.trim().toLowerCase().replace(/\s+/g, '-')))
    : VALUETRACK;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 text-[#15181A] font-sans">
      <h1 className="font-serif text-3xl sm:text-4xl font-light">Ads Manager</h1>
      <p className="text-sm text-[#5B605F] mt-1 mb-6">
        One landing page per published property. Paste the <strong>Final URL</strong> into Google Ads; the tracking
        parameters travel with each lead.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <label className="text-xs uppercase tracking-wider font-semibold">
          Live website domain
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1 w-full p-2.5 border border-[#CFD1CA] bg-white text-sm normal-case font-normal"
          />
        </label>
        <label className="text-xs uppercase tracking-wider font-semibold">
          Campaign name (optional)
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Leave empty to use Google's {campaignid}"
            className="mt-1 w-full p-2.5 border border-[#CFD1CA] bg-white text-sm normal-case font-normal"
          />
        </label>
      </div>

      {properties === null ? <p className="text-sm text-[#5B605F]">Loading properties…</p> : null}
      {properties?.length === 0 ? (
        <p className="text-sm text-[#5B605F] border border-[#CFD1CA] bg-[#F7F7F4] p-4">
          No published properties yet. Landing pages exist only for published properties: a draft returns a 404.
        </p>
      ) : null}

      <div className="space-y-3">
        {properties?.map((p) => {
          const path = `/${p.slug}/project`;
          const finalUrl = `${base}${path}`;
          return (
            <div key={p.id} className="border border-[#CFD1CA] bg-[#F7F7F4] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{p.title}</h2>
                <span className="text-xs text-[#5B605F]">
                  {p.location} · {p.priceFormatted}
                </span>
              </div>
              <p className="mt-2 text-xs font-mono break-all text-[#3b403f]">{finalUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={finalUrl} label="Copy Final URL" />
                <CopyButton text={suffix} label="Copy tracking suffix" />
                <CopyButton text={`${finalUrl}?${suffix}`} label="Copy URL with tracking" />
                <a
                  href={path}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CFD1CA] bg-white hover:bg-[#EDEEE9] text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Preview
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-xs text-[#5B605F] space-y-1">
        <p>
          <strong>How to use in Google Ads:</strong> set the ad&apos;s Final URL to the plain link, and paste the tracking
          suffix into the campaign&apos;s &quot;Final URL suffix&quot;. Google replaces {'{keyword}'}, {'{campaignid}'} and
          {' {creative}'} on every click.
        </p>
        <p>Landing pages are hidden from search engines and use the same data as the main property page.</p>
      </div>
    </div>
  );
}

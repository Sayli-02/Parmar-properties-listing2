import { notFound } from 'next/navigation';
import { fetchPropertyBySlug } from '@/lib/supabase/properties';
import { Cinematic } from '@/components/ppc/options/Cinematic';
import { Folio } from '@/components/ppc/options/Folio';
import { Split } from '@/components/ppc/options/Split';
import { Express } from '@/components/ppc/options/Express';
import { AdPreview } from '@/components/ppc/AdPreview';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

// Design exploration only: never served in production.
export default async function PpcPreview({ params }: { params: { v: string; slug: string } }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const property = await fetchPropertyBySlug(params.slug);
  if (!property) notFound();
  switch (params.v) {
    case 'a': return <Cinematic property={property} />;
    case 'b': return <Folio property={property} />;
    case 'c': return <Split property={property} />;
    case 'd': return <Express property={property} />;
    case 'ad': return <AdPreview property={property} />;
    default: notFound();
  }
}

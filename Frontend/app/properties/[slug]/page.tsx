import { notFound } from 'next/navigation';
import { PROPERTIES } from '@/data/properties';
import { PropertyDetailClient } from '@/components/property/PropertyDetailClient';
import { fetchPropertyBySlug } from '@/lib/supabase/properties';

export function generateStaticParams() {
  return PROPERTIES.map((property) => ({
    slug: property.slug,
  }));
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const property = await fetchPropertyBySlug(params.slug);

  if (!property) {
    notFound();
  }

  return <PropertyDetailClient property={property} />;
}

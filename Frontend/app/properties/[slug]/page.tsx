import { notFound } from 'next/navigation';
import { PROPERTIES } from '@/data/properties';
import { PropertyDetailClient } from '@/components/property/PropertyDetailClient';

export function generateStaticParams() {
  return PROPERTIES.map((property) => ({
    slug: property.slug,
  }));
}

export default function PropertyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const property = PROPERTIES.find((p) => p.slug === params.slug);

  if (!property) {
    notFound();
  }

  return <PropertyDetailClient property={property} />;
}

import { notFound } from 'next/navigation';
import { PropertyDetailClient } from '@/components/property/PropertyDetailClient';
import {
  fetchPropertyBySlug,
  fetchPublishedProperties,
  fetchPublishedPropertySlugs,
  pickSimilarProperties,
} from '@/lib/supabase/properties';

export async function generateStaticParams() {
  const slugs = await fetchPublishedPropertySlugs();
  return slugs.map((slug) => ({ slug }));
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

  const catalog = await fetchPublishedProperties();
  const similarProperties = pickSimilarProperties(property, catalog);

  return (
    <PropertyDetailClient property={property} similarProperties={similarProperties} />
  );
}

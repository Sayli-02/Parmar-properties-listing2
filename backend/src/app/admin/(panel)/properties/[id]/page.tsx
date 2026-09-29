import type { Metadata } from "next";

import { PropertyEditor } from "@/components/properties/property-editor";

export const metadata: Metadata = {
  title: "Edit property",
};

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PropertyEditor propertyId={id} />;
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import type { Location, Property } from "@/types";
import { propertySchema } from "@/lib/validations";
import { getErrorMessage, slugify } from "@/lib/utils";
import {
  AVAILABILITY_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/constants";
import {
  createProperty,
  isSlugAvailable,
  updateProperty,
} from "@/lib/api/properties";
import { listActiveLocations } from "@/lib/api/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGrid, ToggleField } from "@/components/shared/field";
import { Spinner } from "@/components/shared/states";
import { MapPicker } from "@/components/properties/map-picker";

type PropertyValues = z.input<typeof propertySchema>;
type PropertyOutput = z.output<typeof propertySchema>;

const NO_LOCATION = "none";

interface PropertyFormProps {
  property?: Property;
  onSaved?: (property: Property) => void;
}

function toFormValues(property?: Property): PropertyValues {
  return {
    name: property?.name ?? "",
    slug: property?.slug ?? "",
    property_type: property?.property_type ?? "apartment",
    location_id: property?.location_id ?? "",
    location_name: property?.location_name ?? "",
    city: property?.city ?? "",
    locality: property?.locality ?? "",
    location_details: property?.location_details ?? "",
    tagline: property?.tagline ?? "",
    description: property?.description ?? "",
    project_overview: property?.project_overview ?? "",
    project_details: property?.project_details ?? "",
    developer_name: property?.developer_name ?? "",
    developer_description: property?.developer_description ?? "",
    price_amount: property?.price_amount ?? null,
    price_display: property?.price_display ?? "",
    bhk: property?.bhk ?? "",
    carpet_area: property?.carpet_area ?? "",
    possession: property?.possession ?? "",
    availability: property?.availability ?? "available",
    status: property?.status ?? "active",
    rera_number: property?.rera_number ?? "",
    is_featured: property?.is_featured ?? false,
    is_active: property?.is_active ?? true,
    latitude: property?.latitude ?? null,
    longitude: property?.longitude ?? null,
    google_maps_url: property?.google_maps_url ?? "",
    address: property?.address ?? "",
  };
}

export function PropertyForm({ property, onSaved }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = Boolean(property);

  const [locations, setLocations] = React.useState<Location[]>([]);
  // Once the slug is edited by hand, stop deriving it from the name.
  const [slugLocked, setSlugLocked] = React.useState(isEdit);

  const form = useForm<PropertyValues, unknown, PropertyOutput>({
    resolver: zodResolver(propertySchema),
    defaultValues: toFormValues(property),
  });

  React.useEffect(() => {
    listActiveLocations()
      .then(setLocations)
      .catch((error) => toast.error(getErrorMessage(error)));
  }, []);

  React.useEffect(() => {
    if (property) form.reset(toFormValues(property));
  }, [property, form]);

  const nameValue = form.watch("name");

  React.useEffect(() => {
    if (slugLocked) return;
    form.setValue("slug", slugify(nameValue ?? ""), { shouldValidate: false });
  }, [nameValue, slugLocked, form]);

  async function onSubmit(values: PropertyOutput) {
    try {
      const slugFree = await isSlugAvailable(values.slug, property?.id);
      if (!slugFree) {
        form.setError("slug", {
          message: "Another property already uses this slug.",
        });
        toast.error("That slug is already taken.");
        return;
      }

      if (property) {
        const saved = await updateProperty(property.id, values);
        toast.success("Property saved");
        onSaved?.(saved);
      } else {
        const created = await createProperty(values);
        toast.success("Property created", {
          description: "Now add images, configurations and floor plans.",
        });
        onSaved?.(created);
        router.push(`/admin/properties/${created.id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const { errors, isSubmitting, isDirty } = form.formState;
  const latitude = form.watch("latitude") ?? null;
  const longitude = form.watch("longitude") ?? null;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 pb-20"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>
            How the property is identified across the website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field
              label="Property name"
              htmlFor="name"
              required
              error={errors.name?.message}
            >
              <Input
                id="name"
                placeholder="Parmar Trident Towers"
                aria-invalid={Boolean(errors.name)}
                {...form.register("name")}
              />
            </Field>

            <Field
              label="URL slug"
              htmlFor="slug"
              required
              hint={
                slugLocked
                  ? "Used in the public URL."
                  : "Generated from the name — edit to take over."
              }
              error={errors.slug?.message}
            >
              <div className="flex gap-2">
                <Input
                  id="slug"
                  placeholder="parmar-trident-towers"
                  aria-invalid={Boolean(errors.slug)}
                  {...form.register("slug", {
                    onChange: () => setSlugLocked(true),
                  })}
                />
                {slugLocked && !isEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Regenerate slug from name"
                    onClick={() => {
                      setSlugLocked(false);
                      form.setValue("slug", slugify(form.getValues("name")));
                    }}
                  >
                    <RotateCcw />
                  </Button>
                ) : null}
              </div>
            </Field>

            <Field
              label="Property type"
              error={errors.property_type?.message}
            >
              <Select
                value={form.watch("property_type")}
                onValueChange={(value) =>
                  form.setValue(
                    "property_type",
                    value as PropertyValues["property_type"]
                  )
                }
              >
                <SelectTrigger aria-label="Property type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Configuration"
              htmlFor="bhk"
              hint="Free text, e.g. “2 & 3 BHK”."
              error={errors.bhk?.message}
            >
              <Input id="bhk" placeholder="2 & 3 BHK" {...form.register("bhk")} />
            </Field>
          </FieldGrid>

          <Field
            label="Tagline"
            htmlFor="tagline"
            hint="One line shown under the property name."
            error={errors.tagline?.message}
          >
            <Input
              id="tagline"
              placeholder="Riverside living, minutes from the expressway"
              {...form.register("tagline")}
            />
          </Field>

          <Field
            label="Short description"
            htmlFor="description"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={4}
              placeholder="A concise summary for listing cards and search results."
              {...form.register("description")}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status and visibility</CardTitle>
          <CardDescription>
            Controls where and whether this property appears.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field label="Project status" error={errors.status?.message}>
              <Select
                value={form.watch("status")}
                onValueChange={(value) =>
                  form.setValue("status", value as PropertyValues["status"])
                }
              >
                <SelectTrigger aria-label="Project status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Availability" error={errors.availability?.message}>
              <Select
                value={form.watch("availability")}
                onValueChange={(value) =>
                  form.setValue(
                    "availability",
                    value as PropertyValues["availability"]
                  )
                }
              >
                <SelectTrigger aria-label="Availability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGrid>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              label="Live on the website"
              description="Turn off to hide without deleting."
              control={
                <Switch
                  checked={form.watch("is_active") ?? true}
                  onCheckedChange={(checked) =>
                    form.setValue("is_active", checked, { shouldDirty: true })
                  }
                />
              }
            />
            <ToggleField
              label="Featured"
              description="Highlighted on the home page."
              control={
                <Switch
                  checked={form.watch("is_featured") ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue("is_featured", checked, { shouldDirty: true })
                  }
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>
            The numeric amount drives sorting; the display text is what buyers
            read.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGrid columns={3}>
            <Field
              label="Starting price"
              htmlFor="price_amount"
              hint="Numbers only, used for sorting."
              error={errors.price_amount?.message}
            >
              <Input
                id="price_amount"
                type="number"
                min={0}
                step="1"
                placeholder="9500000"
                {...form.register("price_amount")}
              />
            </Field>
            <Field
              label="Display price"
              htmlFor="price_display"
              hint="Shown as typed, e.g. “₹95 L onwards”."
              error={errors.price_display?.message}
            >
              <Input
                id="price_display"
                placeholder="₹95 L onwards"
                {...form.register("price_display")}
              />
            </Field>
            <Field
              label="Carpet area"
              htmlFor="carpet_area"
              error={errors.carpet_area?.message}
            >
              <Input
                id="carpet_area"
                placeholder="720 – 1,140 sq ft"
                {...form.register("carpet_area")}
              />
            </Field>
            <Field
              label="Possession"
              htmlFor="possession"
              error={errors.possession?.message}
            >
              <Input
                id="possession"
                placeholder="Dec 2027"
                {...form.register("possession")}
              />
            </Field>
            <Field
              label="RERA number"
              htmlFor="rera_number"
              error={errors.rera_number?.message}
            >
              <Input
                id="rera_number"
                placeholder="P52100012345"
                {...form.register("rera_number")}
              />
            </Field>
          </FieldGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>
            Link an existing location for grouping, and pin the exact spot for
            the map.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field
              label="Linked location"
              hint="Used to group properties by area."
              error={errors.location_id?.message}
            >
              <Select
                value={form.watch("location_id") || NO_LOCATION}
                onValueChange={(value) => {
                  const next = value === NO_LOCATION ? "" : value;
                  form.setValue("location_id", next, { shouldDirty: true });

                  const match = locations.find((item) => item.id === next);
                  if (match) {
                    if (!form.getValues("locality")) {
                      form.setValue("locality", match.name);
                    }
                    if (!form.getValues("city") && match.city) {
                      form.setValue("city", match.city);
                    }
                  }
                }}
              >
                <SelectTrigger aria-label="Linked location">
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LOCATION}>Not linked</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                      {location.city ? ` · ${location.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Location label"
              htmlFor="location_name"
              hint="Overrides the linked name on the listing, if needed."
              error={errors.location_name?.message}
            >
              <Input
                id="location_name"
                placeholder="Baner, Pune"
                {...form.register("location_name")}
              />
            </Field>

            <Field
              label="Locality"
              htmlFor="locality"
              error={errors.locality?.message}
            >
              <Input
                id="locality"
                placeholder="Baner"
                {...form.register("locality")}
              />
            </Field>

            <Field label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" placeholder="Pune" {...form.register("city")} />
            </Field>
          </FieldGrid>

          <Field
            label="Address"
            htmlFor="address"
            error={errors.address?.message}
          >
            <Textarea
              id="address"
              rows={2}
              placeholder="Survey no., road, landmark, PIN"
              {...form.register("address")}
            />
          </Field>

          <Field
            label="Connectivity notes"
            htmlFor="location_details"
            hint="Distances to schools, offices, transport."
            error={errors.location_details?.message}
          >
            <Textarea
              id="location_details"
              rows={3}
              placeholder="5 min to Mumbai–Bengaluru Highway · 2 km to Balewadi High Street"
              {...form.register("location_details")}
            />
          </Field>

          <Field
            label="Google Maps link"
            htmlFor="google_maps_url"
            error={errors.google_maps_url?.message}
          >
            <Input
              id="google_maps_url"
              placeholder="https://maps.google.com/…"
              {...form.register("google_maps_url")}
            />
          </Field>

          <MapPicker
            latitude={latitude}
            longitude={longitude}
            latitudeError={errors.latitude?.message}
            longitudeError={errors.longitude?.message}
            onChange={({ latitude: lat, longitude: lng }) => {
              form.setValue("latitude", lat, { shouldDirty: true });
              form.setValue("longitude", lng, { shouldDirty: true });
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project content</CardTitle>
          <CardDescription>
            Longer copy for the property detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Project overview"
            htmlFor="project_overview"
            error={errors.project_overview?.message}
          >
            <Textarea
              id="project_overview"
              rows={5}
              placeholder="The story of the project — vision, scale, what makes it different."
              {...form.register("project_overview")}
            />
          </Field>

          <Field
            label="Project details"
            htmlFor="project_details"
            hint="Specifications, towers, open space, approvals."
            error={errors.project_details?.message}
          >
            <Textarea
              id="project_details"
              rows={5}
              placeholder="2 towers · 18 floors · 1.2 acres · 68% open space"
              {...form.register("project_details")}
            />
          </Field>

          <FieldGrid>
            <Field
              label="Developer name"
              htmlFor="developer_name"
              error={errors.developer_name?.message}
            >
              <Input
                id="developer_name"
                placeholder="Parmar Group"
                {...form.register("developer_name")}
              />
            </Field>
            <Field
              label="Developer description"
              htmlFor="developer_description"
              error={errors.developer_description?.message}
            >
              <Textarea
                id="developer_description"
                rows={3}
                placeholder="Track record, years in business, completed projects."
                {...form.register("developer_description")}
              />
            </Field>
          </FieldGrid>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isEdit
              ? isDirty
                ? "You have unsaved changes."
                : "All changes saved."
              : "Images and configurations can be added after saving."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => router.push("/admin/properties")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <Save />}
              {isEdit ? "Save changes" : "Create property"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

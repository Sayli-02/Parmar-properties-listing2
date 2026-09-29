"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import type { Location, LookupItem, Property } from "@/types";
import { masterPropertySchema } from "@/lib/validations";
import { getErrorMessage, slugify } from "@/lib/utils";
import { PUBLICATION_STATUSES } from "@/lib/constants";
import {
  createMasterProperty,
  isSlugAvailable,
  updateMasterProperty,
} from "@/lib/api/properties";
import { listActiveLocations } from "@/lib/api/locations";
import { listPropertyFormLookups } from "@/lib/api/lookups";
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
import { TagInput } from "@/components/shared/tag-input";
import { MapPicker } from "@/components/properties/map-picker";
import { CompanyOverviewSection } from "@/components/properties/company-overview-section";

type PropertyValues = z.input<typeof masterPropertySchema>;
type PropertyOutput = z.output<typeof masterPropertySchema>;

const NO_LOCATION = "none";
const NO_PHASE = "none";

interface PropertyFormProps {
  property?: Property;
  onSaved?: (property: Property) => void;
}

interface FormLookups {
  locations: LookupItem[];
  bhk: LookupItem[];
  statuses: LookupItem[];
  types: LookupItem[];
  launchPhases: LookupItem[];
}

const emptyLookups: FormLookups = {
  locations: [],
  bhk: [],
  statuses: [],
  types: [],
  launchPhases: [],
};

/** Price and carpet area start blank on a new property, hence `DefaultValues`. */
function toFormValues(property?: Property): DefaultValues<PropertyValues> {
  return {
    title: property?.title ?? property?.name ?? "",
    slug: property?.slug ?? "",
    tagline: property?.tagline ?? "",
    description:
      property?.description ?? property?.project_overview ?? "",
    highlights: property?.highlights ?? [],
    developer_name: property?.developer_name ?? "",
    developer_description: property?.developer_description ?? "",
    lookup_location_id: property?.lookup_location_id ?? "",
    sub_location: property?.sub_location ?? property?.locality ?? "",
    property_type_id: property?.property_type_id ?? "",
    bhk_id: property?.bhk_id ?? "",
    status_id: property?.status_id ?? "",
    price: property?.price ?? undefined,
    carpet_area_sqft: property?.carpet_area_sqft ?? undefined,
    super_area: property?.super_area ?? null,
    possession_date: property?.possession_date ?? property?.possession ?? "",
    floor: property?.floor ?? "",
    is_featured: property?.is_featured ?? false,
    recently_added: property?.recently_added ?? false,
    is_recommended: property?.is_recommended ?? false,
    is_new_launch: property?.is_new_launch ?? false,
    is_luxury_collection: property?.is_luxury_collection ?? false,
    launch_phase_id: property?.launch_phase_id ?? "",
    rera_id: property?.rera_id ?? property?.rera_number ?? "",
    latitude: property?.latitude ?? null,
    longitude: property?.longitude ?? null,
    publication_status: property?.publication_status ?? "published",
    sort_order: property?.sort_order ?? 0,
    meta_title: property?.meta_title ?? "",
    meta_description: property?.meta_description ?? "",
    location_id: property?.location_id ?? "",
  };
}

export function PropertyForm({ property, onSaved }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = Boolean(property);

  const [lookups, setLookups] = React.useState<FormLookups>(emptyLookups);
  const [locations, setLocations] = React.useState<Location[]>([]);
  // Once the slug is edited by hand, stop deriving it from the title.
  const [slugLocked, setSlugLocked] = React.useState(isEdit);

  const form = useForm<PropertyValues, unknown, PropertyOutput>({
    resolver: zodResolver(masterPropertySchema),
    defaultValues: toFormValues(property),
  });

  React.useEffect(() => {
    listPropertyFormLookups()
      .then((loaded) =>
        setLookups({
          locations: loaded.locations,
          bhk: loaded.bhk,
          statuses: loaded.statuses,
          types: loaded.types,
          launchPhases: loaded.launchPhases,
        })
      )
      .catch((error) => toast.error(getErrorMessage(error)));

    listActiveLocations()
      .then(setLocations)
      .catch((error) => toast.error(getErrorMessage(error)));
  }, []);

  React.useEffect(() => {
    if (property) form.reset(toFormValues(property));
  }, [property, form]);

  const titleValue = form.watch("title");

  React.useEffect(() => {
    if (slugLocked) return;
    form.setValue("slug", slugify(titleValue ?? ""), { shouldValidate: false });
  }, [titleValue, slugLocked, form]);

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
        const saved = await updateMasterProperty(property.id, values);
        toast.success("Property saved");
        onSaved?.(saved);
      } else {
        const created = await createMasterProperty(values);
        toast.success("Property created", {
          description:
            "Opening Media & Documents so you can upload cover, gallery, RERA QR, brochure and floor plans. Configurations remain a sibling tab.",
        });
        onSaved?.(created);
        router.push(`/admin/properties/${created.id}?tab=media`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const { errors, isSubmitting, isDirty } = form.formState;
  const latitude = form.watch("latitude") ?? null;
  const longitude = form.watch("longitude") ?? null;
  const highlights = form.watch("highlights") ?? [];
  const isNewLaunch = form.watch("is_new_launch") ?? false;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 pb-20"
      noValidate
    >
      {/* —— Property Information —— */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
          <CardDescription>
            How the residence is identified across the website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field
              label="Title"
              htmlFor="title"
              required
              error={errors.title?.message}
            >
              <Input
                id="title"
                placeholder="Parmar Trident Towers"
                aria-invalid={Boolean(errors.title)}
                {...form.register("title")}
              />
            </Field>

            <Field
              label="URL slug"
              htmlFor="slug"
              required
              hint={
                slugLocked
                  ? "Used in the public URL."
                  : "Generated from the title — edit to take over."
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
                    aria-label="Regenerate slug from title"
                    onClick={() => {
                      setSlugLocked(false);
                      form.setValue("slug", slugify(form.getValues("title")));
                    }}
                  >
                    <RotateCcw />
                  </Button>
                ) : null}
              </div>
            </Field>
          </FieldGrid>

          <Field
            label="Tagline"
            htmlFor="tagline"
            required
            hint="One line shown under the title on cards and the detail page."
            error={errors.tagline?.message}
          >
            <Input
              id="tagline"
              placeholder="Sea-facing residences on Worli Sea Face"
              aria-invalid={Boolean(errors.tagline)}
              {...form.register("tagline")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* —— Project Overview —— */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>
            Editorial body and signature highlights shown in the Project
            Overview section on the public Property Detail page. Construction
            status and MahaRERA number are edited in Classification and
            Compliance below — they are not duplicated here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Overview"
            htmlFor="description"
            required
            hint="The paragraph under Project Overview on the Detail page."
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={5}
              placeholder="Perfect harmony between cultural heritage and ultra-modern coastal architecture…"
              aria-invalid={Boolean(errors.description)}
              {...form.register("description")}
            />
          </Field>

          <Field
            label="Signature architectural highlights"
            htmlFor="highlights"
            required
            hint="Three to five bullet points under Signature Architectural Highlights."
            error={
              errors.highlights?.message ??
              errors.highlights?.root?.message
            }
          >
            <TagInput
              id="highlights"
              value={highlights}
              placeholder="Uninterrupted Arabian Sea views"
              disabled={isSubmitting}
              onChange={(next) =>
                form.setValue("highlights", next, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </Field>
        </CardContent>
      </Card>

      {/* —— Company / Developer Overview —— */}
      <CompanyOverviewSection form={form} />

      {/* —— Location —— */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>
            Canonical micro-market relationship plus property-specific
            sub-location and map pin for Enclave Location &amp; Vicinity.
            Editorial location-page content is managed under Locations — not
            copied onto the property.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field
              label="Location"
              required
              hint="Lookup micro-market used for filtering (lookup_locations)."
              error={errors.lookup_location_id?.message}
            >
              <Select
                value={form.watch("lookup_location_id") || ""}
                onValueChange={(value) =>
                  form.setValue("lookup_location_id", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger aria-label="Location">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.locations.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Sub-location"
              htmlFor="sub_location"
              required
              hint="For example “Worli Sea Face, South Mumbai” — shown as the prime locality line."
              error={errors.sub_location?.message}
            >
              <Input
                id="sub_location"
                placeholder="Worli Sea Face, South Mumbai"
                aria-invalid={Boolean(errors.sub_location)}
                {...form.register("sub_location")}
              />
            </Field>

            <Field
              label="Micro-market page"
              hint="Optional link to the editorial location dossier (locations table)."
              error={errors.location_id?.message}
              className="sm:col-span-2"
            >
              <Select
                value={form.watch("location_id") || NO_LOCATION}
                onValueChange={(value) =>
                  form.setValue(
                    "location_id",
                    value === NO_LOCATION ? "" : value,
                    { shouldDirty: true }
                  )
                }
              >
                <SelectTrigger aria-label="Micro-market page">
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
          </FieldGrid>

          <MapPicker
            latitude={latitude === null ? null : Number(latitude)}
            longitude={longitude === null ? null : Number(longitude)}
            latitudeError={errors.latitude?.message}
            longitudeError={errors.longitude?.message}
            onChange={({ latitude: lat, longitude: lng }) => {
              form.setValue("latitude", lat, { shouldDirty: true });
              form.setValue("longitude", lng, { shouldDirty: true });
            }}
          />
        </CardContent>
      </Card>

      {/* —— Classification —— */}
      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
          <CardDescription>
            Catalogues behind filters and badges. Construction status also
            appears inside Project Overview on the public Detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid columns={3}>
            <Field
              label="Property type"
              required
              error={errors.property_type_id?.message}
            >
              <Select
                value={form.watch("property_type_id") || ""}
                onValueChange={(value) =>
                  form.setValue("property_type_id", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger aria-label="Property type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.types.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="BHK" required error={errors.bhk_id?.message}>
              <Select
                value={form.watch("bhk_id") || ""}
                onValueChange={(value) =>
                  form.setValue("bhk_id", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger aria-label="BHK">
                  <SelectValue placeholder="Select a configuration" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.bhk.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Construction status"
              required
              error={errors.status_id?.message}
            >
              <Select
                value={form.watch("status_id") || ""}
                onValueChange={(value) =>
                  form.setValue("status_id", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger aria-label="Construction status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.statuses.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGrid>
        </CardContent>
      </Card>

      {/* —— Pricing & Area / Property Details —— */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; Area</CardTitle>
          <CardDescription>
            Price drives catalogue range filters; areas drive card and detail
            specs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGrid columns={3}>
            <Field
              label="Price (₹ Cr)"
              htmlFor="price"
              required
              hint="Decimals allowed, for example 7.80."
              error={errors.price?.message}
            >
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="7.80"
                aria-invalid={Boolean(errors.price)}
                {...form.register("price")}
              />
            </Field>

            <Field
              label="Carpet area (sq ft)"
              htmlFor="carpet_area_sqft"
              required
              error={errors.carpet_area_sqft?.message}
            >
              <Input
                id="carpet_area_sqft"
                type="number"
                min={0}
                step="1"
                placeholder="1820"
                aria-invalid={Boolean(errors.carpet_area_sqft)}
                {...form.register("carpet_area_sqft")}
              />
            </Field>

            <Field
              label="Super area (sq ft)"
              htmlFor="super_area"
              hint="Optional, shown in the detail specs."
              error={errors.super_area?.message}
            >
              <Input
                id="super_area"
                type="number"
                min={0}
                step="1"
                placeholder="2450"
                {...form.register("super_area")}
              />
            </Field>
          </FieldGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>
            Possession and floor lines shown on cards and the Detail page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGrid>
            <Field
              label="Possession"
              htmlFor="possession_date"
              required
              hint="Free text, for example “Ready to Move” or “Q4 2027”."
              error={errors.possession_date?.message}
            >
              <Input
                id="possession_date"
                placeholder="Q4 2027"
                aria-invalid={Boolean(errors.possession_date)}
                {...form.register("possession_date")}
              />
            </Field>

            <Field
              label="Floor"
              htmlFor="floor"
              required
              hint="For example “42nd Floor of 58”."
              error={errors.floor?.message}
            >
              <Input
                id="floor"
                placeholder="42nd Floor of 58"
                aria-invalid={Boolean(errors.floor)}
                {...form.register("floor")}
              />
            </Field>
          </FieldGrid>
        </CardContent>
      </Card>

      {/* —— Compliance —— */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>
            Project MahaRERA number shown in Project Overview. Upload the QR
            image and brochure under Media &amp; Documents — those stay separate
            from the gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            label="MahaRERA number"
            htmlFor="rera_id"
            required
            error={errors.rera_id?.message}
          >
            <Input
              id="rera_id"
              placeholder="P51900012345"
              aria-invalid={Boolean(errors.rera_id)}
              {...form.register("rera_id")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* —— Publishing / SEO —— */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing &amp; SEO</CardTitle>
          <CardDescription>
            Where this residence appears, collection flags, and search engine
            overrides.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field
              label="Publication status"
              hint="Only published residences are visible to the public."
              error={errors.publication_status?.message}
            >
              <Select
                value={form.watch("publication_status") ?? "published"}
                onValueChange={(value) =>
                  form.setValue(
                    "publication_status",
                    value as PropertyValues["publication_status"],
                    { shouldDirty: true }
                  )
                }
              >
                <SelectTrigger aria-label="Publication status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUBLICATION_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Sort order"
              htmlFor="sort_order"
              hint="Lower numbers come first in the catalogue."
              error={errors.sort_order?.message}
            >
              <Input
                id="sort_order"
                type="number"
                min={0}
                step="1"
                {...form.register("sort_order")}
              />
            </Field>
          </FieldGrid>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              label="Featured"
              description="Shown in the highlighted set on the home page."
              control={
                <Switch
                  checked={form.watch("is_featured") ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue("is_featured", checked, { shouldDirty: true })
                  }
                />
              }
            />
            <ToggleField
              label="Recently added"
              description="Gives the listing sort priority and a badge."
              control={
                <Switch
                  checked={form.watch("recently_added") ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue("recently_added", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              }
            />
            <ToggleField
              label="Recommended pick"
              description="Adds the editorial recommendation badge."
              control={
                <Switch
                  checked={form.watch("is_recommended") ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue("is_recommended", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              }
            />
            <ToggleField
              label="New launch"
              description="Places the listing in the New Launches tab."
              control={
                <Switch
                  checked={isNewLaunch}
                  onCheckedChange={(checked) =>
                    form.setValue("is_new_launch", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              }
            />
            <ToggleField
              label="Luxury collection"
              description="Include in Luxury Collection (also auto for ₹25 Cr+)."
              control={
                <Switch
                  checked={form.watch("is_luxury_collection") ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue("is_luxury_collection", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              }
            />
          </div>

          <Field
            label="Launch phase"
            hint="Badge shown on new launch cards."
            error={errors.launch_phase_id?.message}
          >
            <Select
              value={form.watch("launch_phase_id") || NO_PHASE}
              onValueChange={(value) =>
                form.setValue(
                  "launch_phase_id",
                  value === NO_PHASE ? "" : value,
                  { shouldDirty: true }
                )
              }
            >
              <SelectTrigger aria-label="Launch phase">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PHASE}>Not set</SelectItem>
                {lookups.launchPhases.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Meta title"
            htmlFor="meta_title"
            error={errors.meta_title?.message}
          >
            <Input
              id="meta_title"
              placeholder="Sea-facing 4 BHK residences in Worli"
              {...form.register("meta_title")}
            />
          </Field>

          <Field
            label="Meta description"
            htmlFor="meta_description"
            error={errors.meta_description?.message}
          >
            <Textarea
              id="meta_description"
              rows={2}
              placeholder="A short summary for search results."
              {...form.register("meta_description")}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isEdit
              ? isDirty
                ? "You have unsaved changes."
                : "All changes saved."
              : "After saving, you will open Media & Documents to upload cover, gallery, RERA QR, brochure and floor plans."}
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

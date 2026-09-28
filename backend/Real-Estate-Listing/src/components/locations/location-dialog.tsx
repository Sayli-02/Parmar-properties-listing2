"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import type { Location } from "@/types";
import { locationSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import {
  createLocation,
  getNextLocationOrder,
  updateLocation,
} from "@/lib/api/locations";
import { deleteFile, storageFolders } from "@/lib/api/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGrid, ToggleField } from "@/components/shared/field";
import { Spinner } from "@/components/shared/states";
import {
  MediaPicker,
  unchangedSelection,
  uploadSelection,
  type FileSelection,
} from "@/components/shared/media-picker";

type LocationValues = z.input<typeof locationSchema>;
type LocationOutput = z.output<typeof locationSchema>;

interface LocationDialogProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function LocationDialog({
  location,
  open,
  onOpenChange,
  onSaved,
}: LocationDialogProps) {
  const [selection, setSelection] =
    React.useState<FileSelection>(unchangedSelection);

  const form = useForm<LocationValues, unknown, LocationOutput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      city: "",
      is_active: true,
      display_order: 0,
    },
  });

  React.useEffect(() => {
    if (!open) return;

    setSelection(unchangedSelection);
    form.reset({
      name: location?.name ?? "",
      tagline: location?.tagline ?? "",
      description: location?.description ?? "",
      city: location?.city ?? "",
      is_active: location?.is_active ?? true,
      display_order: location?.display_order ?? 0,
    });
  }, [open, location, form]);

  async function onSubmit(values: LocationOutput) {
    try {
      const uploaded = await uploadSelection(
        selection,
        storageFolders.locations
      );

      if (location) {
        await updateLocation(location.id, values, uploaded);
        if (uploaded !== undefined && location.image_path) {
          await deleteFile(location.image_path);
        }
        toast.success("Location updated");
      } else {
        await createLocation(
          { ...values, display_order: await getNextLocationOrder() },
          uploaded ?? null
        );
        toast.success("Location created");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {location ? "Edit location" : "New location"}
          </DialogTitle>
          <DialogDescription>
            Locations group your properties by area and can be featured on the
            website.
          </DialogDescription>
        </DialogHeader>

        <form
          id="location-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGrid>
            <Field
              label="Name"
              htmlFor="name"
              required
              error={form.formState.errors.name?.message}
            >
              <Input
                id="name"
                placeholder="Baner"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
            </Field>
            <Field
              label="City"
              htmlFor="city"
              error={form.formState.errors.city?.message}
            >
              <Input id="city" placeholder="Pune" {...form.register("city")} />
            </Field>
          </FieldGrid>

          <Field
            label="Tagline"
            htmlFor="tagline"
            hint="A short line shown under the location name."
            error={form.formState.errors.tagline?.message}
          >
            <Input
              id="tagline"
              placeholder="Pune's most connected suburb"
              {...form.register("tagline")}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="description"
              rows={4}
              placeholder="Why buyers choose this area — connectivity, schools, workplaces."
              {...form.register("description")}
            />
          </Field>

          <Field label="Image">
            <MediaPicker
              existingUrl={location?.image_url}
              selection={selection}
              onSelectionChange={setSelection}
              disabled={isSubmitting}
            />
          </Field>

          <ToggleField
            label="Show on the website"
            description="Hidden locations stay available for tagging properties."
            control={
              <Switch
                checked={form.watch("is_active") ?? true}
                onCheckedChange={(checked) =>
                  form.setValue("is_active", checked)
                }
              />
            }
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="location-form" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            {location ? "Save changes" : "Create location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

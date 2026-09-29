"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import type { PropertyConfiguration } from "@/types";
import { propertyConfigurationSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import { PLAN_TYPES, VARIANT_CODES } from "@/lib/constants";
import {
  createPropertyConfiguration,
  getNextPropertyConfigurationOrder,
  updatePropertyConfiguration,
} from "@/lib/api/property-configurations";
import {
  deleteFile,
  resolvePublicUrl,
  storageFolders,
} from "@/lib/api/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGrid } from "@/components/shared/field";
import { Spinner } from "@/components/shared/states";
import {
  MediaPicker,
  unchangedSelection,
  uploadSelection,
  type FileSelection,
} from "@/components/shared/media-picker";

type LayoutValues = z.input<typeof propertyConfigurationSchema>;
type LayoutOutput = z.output<typeof propertyConfigurationSchema>;

interface PropertyConfigurationDialogProps {
  propertyId: string;
  configuration: PropertyConfiguration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PropertyConfigurationDialog({
  propertyId,
  configuration,
  open,
  onOpenChange,
  onSaved,
}: PropertyConfigurationDialogProps) {
  const [selection, setSelection] =
    React.useState<FileSelection>(unchangedSelection);

  const form = useForm<LayoutValues, unknown, LayoutOutput>({
    resolver: zodResolver(propertyConfigurationSchema),
    defaultValues: {
      plan_type: "individual",
      variant_code: "3bhk",
      tab_label: "",
      title: "",
      area_range: "",
      carpet_area: "",
      price_indicator: "",
      tower_zone: "",
      image_path: "",
      display_order: 0,
    },
  });

  React.useEffect(() => {
    if (!open) return;

    setSelection(unchangedSelection);
    form.reset({
      plan_type: configuration?.plan_type ?? "individual",
      variant_code: configuration?.variant_code ?? "3bhk",
      tab_label: configuration?.tab_label ?? "",
      title: configuration?.title ?? "",
      area_range: configuration?.area_range ?? "",
      carpet_area: configuration?.carpet_area ?? "",
      price_indicator: configuration?.price_indicator ?? "",
      tower_zone: configuration?.tower_zone ?? "",
      image_path: configuration?.image_path ?? "",
      display_order: configuration?.display_order ?? 0,
    });
  }, [open, configuration, form]);

  async function onSubmit(values: LayoutOutput) {
    try {
      const uploaded = await uploadSelection(
        selection,
        storageFolders.propertyLayouts(propertyId)
      );

      const imagePath =
        uploaded === undefined
          ? values.image_path
          : uploaded === null
            ? ""
            : uploaded.path;

      if (configuration) {
        await updatePropertyConfiguration(configuration.id, {
          ...values,
          image_path: imagePath,
        });
        if (uploaded !== undefined && configuration.image_path) {
          await deleteFile(configuration.image_path);
        }
        toast.success("Layout updated");
      } else {
        await createPropertyConfiguration(propertyId, {
          ...values,
          image_path: imagePath,
          display_order: await getNextPropertyConfigurationOrder(propertyId),
        });
        toast.success("Layout added");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{configuration ? "Edit layout" : "New layout"}</DialogTitle>
          <DialogDescription>
            One tab on the property detail page, with the plan drawing buyers
            see.
          </DialogDescription>
        </DialogHeader>

        <form
          id="property-configuration-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGrid>
            <Field label="Plan type" error={errors.plan_type?.message}>
              <Select
                value={form.watch("plan_type") ?? "individual"}
                onValueChange={(value) =>
                  form.setValue("plan_type", value as LayoutValues["plan_type"])
                }
              >
                <SelectTrigger aria-label="Plan type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Variant" error={errors.variant_code?.message}>
              <Select
                value={form.watch("variant_code") ?? "3bhk"}
                onValueChange={(value) =>
                  form.setValue(
                    "variant_code",
                    value as LayoutValues["variant_code"]
                  )
                }
              >
                <SelectTrigger aria-label="Variant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIANT_CODES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Tab label"
              htmlFor="layout-tab-label"
              required
              hint="Short label on the tab, e.g. “3 BHK”."
              error={errors.tab_label?.message}
            >
              <Input
                id="layout-tab-label"
                placeholder="3 BHK"
                aria-invalid={Boolean(errors.tab_label)}
                {...form.register("tab_label")}
              />
            </Field>

            <Field
              label="Title"
              htmlFor="layout-title"
              required
              error={errors.title?.message}
            >
              <Input
                id="layout-title"
                placeholder="3 BHK Sky Residence"
                aria-invalid={Boolean(errors.title)}
                {...form.register("title")}
              />
            </Field>

            <Field
              label="Area range"
              htmlFor="layout-area-range"
              error={errors.area_range?.message}
            >
              <Input
                id="layout-area-range"
                placeholder="1,450 – 1,820 sq ft"
                {...form.register("area_range")}
              />
            </Field>

            <Field
              label="Carpet area"
              htmlFor="layout-carpet-area"
              error={errors.carpet_area?.message}
            >
              <Input
                id="layout-carpet-area"
                placeholder="1,820 sq ft"
                {...form.register("carpet_area")}
              />
            </Field>

            <Field
              label="Price indicator"
              htmlFor="layout-price-indicator"
              error={errors.price_indicator?.message}
            >
              <Input
                id="layout-price-indicator"
                placeholder="₹7.80 Cr – ₹9.20 Cr"
                {...form.register("price_indicator")}
              />
            </Field>

            <Field
              label="Tower or zone"
              htmlFor="layout-tower-zone"
              error={errors.tower_zone?.message}
            >
              <Input
                id="layout-tower-zone"
                placeholder="High-Rise Sky Suites (Levels 22–48)"
                {...form.register("tower_zone")}
              />
            </Field>
          </FieldGrid>

          <Field label="Plan drawing" error={errors.image_path?.message}>
            <MediaPicker
              existingUrl={resolvePublicUrl(configuration?.image_path)}
              selection={selection}
              onSelectionChange={setSelection}
              disabled={isSubmitting}
              emptyLabel="Upload the plan"
            />
          </Field>
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
          <Button
            type="submit"
            form="property-configuration-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner /> : null}
            {configuration ? "Save changes" : "Add layout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

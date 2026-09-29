"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import type { Amenity } from "@/types";
import { amenitySchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import { createAmenity, updateAmenity } from "@/lib/api/amenities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, ToggleField } from "@/components/shared/field";
import { Spinner } from "@/components/shared/states";

type AmenityValues = z.input<typeof amenitySchema>;
type AmenityOutput = z.output<typeof amenitySchema>;

interface AmenityDialogProps {
  amenity: Amenity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AmenityDialog({
  amenity,
  open,
  onOpenChange,
  onSaved,
}: AmenityDialogProps) {
  const form = useForm<AmenityValues, unknown, AmenityOutput>({
    resolver: zodResolver(amenitySchema),
    defaultValues: { name: "", icon: "", is_active: true },
  });

  React.useEffect(() => {
    if (!open) return;

    form.reset({
      name: amenity?.name ?? "",
      icon: amenity?.icon ?? "",
      is_active: amenity?.is_active ?? true,
    });
  }, [open, amenity, form]);

  async function onSubmit(values: AmenityOutput) {
    try {
      if (amenity) {
        await updateAmenity(amenity.id, values);
        toast.success("Amenity updated");
      } else {
        await createAmenity(values);
        toast.success("Amenity added");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes("already taken")) {
        form.setError("name", { message: "An amenity with that name exists." });
      }
      toast.error(message);
    }
  }

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{amenity ? "Edit amenity" : "New amenity"}</DialogTitle>
          <DialogDescription>
            Amenities are shared across properties, so naming them consistently
            keeps listings tidy.
          </DialogDescription>
        </DialogHeader>

        <form
          id="amenity-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <Field
            label="Name"
            htmlFor="name"
            required
            error={form.formState.errors.name?.message}
          >
            <Input
              id="name"
              placeholder="Swimming pool"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
          </Field>

          <Field
            label="Icon"
            htmlFor="icon"
            hint="Optional icon name for the website, e.g. waves or dumbbell."
            error={form.formState.errors.icon?.message}
          >
            <Input id="icon" placeholder="waves" {...form.register("icon")} />
          </Field>

          <ToggleField
            label="Available for selection"
            description="Inactive amenities stay on properties that already use them."
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
          <Button type="submit" form="amenity-form" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            {amenity ? "Save changes" : "Add amenity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

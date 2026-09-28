"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import type { MarketIntelligence } from "@/types";
import { marketIntelligenceSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";
import {
  createMarketIntelligence,
  getNextMarketOrder,
  updateMarketIntelligence,
} from "@/lib/api/market-intelligence";
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

type MetricValues = z.input<typeof marketIntelligenceSchema>;
type MetricOutput = z.output<typeof marketIntelligenceSchema>;

interface MetricDialogProps {
  metric: MarketIntelligence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function MetricDialog({
  metric,
  open,
  onOpenChange,
  onSaved,
}: MetricDialogProps) {
  const form = useForm<MetricValues, unknown, MetricOutput>({
    resolver: zodResolver(marketIntelligenceSchema),
    defaultValues: {
      title: "",
      value: "",
      unit: "",
      description: "",
      change_percentage: null,
      source: "",
      is_active: true,
      display_order: 0,
    },
  });

  React.useEffect(() => {
    if (!open) return;

    form.reset({
      title: metric?.title ?? "",
      value: metric?.value ?? "",
      unit: metric?.unit ?? "",
      description: metric?.description ?? "",
      change_percentage: metric?.change_percentage ?? null,
      source: metric?.source ?? "",
      is_active: metric?.is_active ?? true,
      display_order: metric?.display_order ?? 0,
    });
  }, [open, metric, form]);

  async function onSubmit(values: MetricOutput) {
    try {
      if (metric) {
        await updateMarketIntelligence(metric.id, values);
        toast.success("Metric updated");
      } else {
        await createMarketIntelligence({
          ...values,
          display_order: await getNextMarketOrder(),
        });
        toast.success("Metric created");
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
          <DialogTitle>{metric ? "Edit metric" : "New metric"}</DialogTitle>
          <DialogDescription>
            Headline numbers that build confidence, such as average price growth
            or absorption rate.
          </DialogDescription>
        </DialogHeader>

        <form
          id="metric-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <Field
            label="Title"
            htmlFor="title"
            required
            error={form.formState.errors.title?.message}
          >
            <Input
              id="title"
              placeholder="Average price growth"
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title")}
            />
          </Field>

          <FieldGrid columns={3}>
            <Field
              label="Value"
              htmlFor="value"
              required
              hint="Shown exactly as typed."
              error={form.formState.errors.value?.message}
            >
              <Input
                id="value"
                placeholder="8.4"
                aria-invalid={Boolean(form.formState.errors.value)}
                {...form.register("value")}
              />
            </Field>
            <Field
              label="Unit"
              htmlFor="unit"
              error={form.formState.errors.unit?.message}
            >
              <Input id="unit" placeholder="% YoY" {...form.register("unit")} />
            </Field>
            <Field
              label="Change"
              htmlFor="change_percentage"
              hint="Optional, positive or negative."
              error={form.formState.errors.change_percentage?.message}
            >
              <Input
                id="change_percentage"
                type="number"
                step="0.01"
                placeholder="1.2"
                {...form.register("change_percentage")}
              />
            </Field>
          </FieldGrid>

          <Field
            label="Description"
            htmlFor="description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="description"
              rows={3}
              placeholder="What this number means for buyers."
              {...form.register("description")}
            />
          </Field>

          <Field
            label="Source"
            htmlFor="source"
            hint="Where the figure came from, for credibility."
            error={form.formState.errors.source?.message}
          >
            <Input
              id="source"
              placeholder="Knight Frank India, Q2 2026"
              {...form.register("source")}
            />
          </Field>

          <ToggleField
            label="Show on the website"
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
          <Button type="submit" form="metric-form" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            {metric ? "Save changes" : "Create metric"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { Image as ImageIcon, LayoutPanelTop, Pencil, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import type { PropertyConfiguration } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { useResource } from "@/lib/hooks/use-resource";
import { getPlanTypeLabel, getVariantLabel } from "@/lib/constants";
import {
  deletePropertyConfiguration,
  listPropertyConfigurations,
  reorderPropertyConfigurations,
} from "@/lib/api/property-configurations";
import { deleteFile, resolvePublicUrl } from "@/lib/api/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
} from "@/components/shared/states";
import { ConfirmDialog, useConfirm } from "@/components/shared/confirm-dialog";
import { OrderControls, moveItem } from "@/components/shared/order-controls";
import { PropertyConfigurationDialog } from "@/components/properties/property-configuration-dialog";

/**
 * The layout tabs shown on the public property page (`property_configurations`).
 */
export function PropertyConfigurationsManager({
  propertyId,
  onChanged,
}: {
  propertyId: string;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PropertyConfiguration | null>(
    null
  );
  const confirm = useConfirm<PropertyConfiguration>();

  const fetchLayouts = React.useCallback(
    () => listPropertyConfigurations(propertyId),
    [propertyId]
  );

  const {
    data: layouts,
    setData: setLayouts,
    loading,
    error,
    reload,
  } = useResource<PropertyConfiguration[]>(fetchLayouts, []);

  async function handleMove(from: number, to: number) {
    const next = moveItem(layouts, from, to);
    if (next === layouts) return;

    setLayouts(next);
    setBusy(true);
    try {
      await reorderPropertyConfigurations(next.map((item) => item.id));
    } catch (caught) {
      toast.error(getErrorMessage(caught));
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Layouts</CardTitle>
          <CardDescription>
            The 2–5 BHK tabs on the property page, each with its own plan
            drawing, areas and price band.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add layout
        </Button>
      </CardHeader>

      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <LoadingBlock label="Loading layouts…" />
        ) : layouts.length === 0 ? (
          <EmptyState
            icon={<LayoutPanelTop />}
            title="No layouts yet"
            description="Add one layout per tab buyers can switch between, such as 3 BHK and 4 BHK."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus />
                Add layout
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {layouts.map((layout, index) => {
              const previewUrl = resolvePublicUrl(layout.image_path);

              return (
                <div
                  key={layout.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                >
                  <OrderControls
                    index={index}
                    total={layouts.length}
                    disabled={busy}
                    onMove={handleMove}
                  />

                  {previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={previewUrl}
                      alt={layout.title}
                      className="size-12 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
                      <ImageIcon className="size-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{layout.title}</p>
                      <Badge variant="secondary">{layout.tab_label}</Badge>
                      <Badge variant="outline">
                        {getVariantLabel(layout.variant_code)}
                      </Badge>
                      <Badge variant="muted">
                        {getPlanTypeLabel(layout.plan_type)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        layout.area_range,
                        layout.carpet_area,
                        layout.price_indicator,
                        layout.tower_zone,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No details added"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Edit ${layout.title}`}
                      onClick={() => {
                        setEditing(layout);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${layout.title}`}
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => confirm.ask(layout)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <PropertyConfigurationDialog
        propertyId={propertyId}
        configuration={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => {
          reload();
          onChanged?.();
        }}
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.setOpen}
        title="Delete this layout?"
        description={
          confirm.target
            ? `${confirm.target.title} and its plan drawing will be removed from the property page.`
            : undefined
        }
        confirmLabel="Delete layout"
        destructive
        onConfirm={async () => {
          if (!confirm.target) return;
          try {
            await deletePropertyConfiguration(confirm.target.id);
            await deleteFile(
              confirm.target.image_path.startsWith("http")
                ? null
                : confirm.target.image_path
            );
            toast.success("Layout deleted");
            reload();
            onChanged?.();
          } catch (caught) {
            toast.error(getErrorMessage(caught));
          }
        }}
      />
    </Card>
  );
}

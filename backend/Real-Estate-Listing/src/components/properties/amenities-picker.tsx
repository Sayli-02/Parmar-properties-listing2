"use client";

import * as React from "react";
import Link from "next/link";
import { Boxes, Save, Search } from "lucide-react";
import { toast } from "sonner";

import type { Amenity } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { useResource } from "@/lib/hooks/use-resource";
import {
  listActiveAmenities,
  listPropertyAmenities,
  setPropertyAmenities,
} from "@/lib/api/amenities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  Spinner,
} from "@/components/shared/states";

export function AmenitiesPicker({ propertyId }: { propertyId: string }) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const fetchAmenities = React.useCallback(async () => {
    const [amenities, links] = await Promise.all([
      listActiveAmenities(),
      listPropertyAmenities(propertyId),
    ]);

    // Amenities already attached stay visible even if later deactivated.
    const attached = links
      .map((link) => link.amenity)
      .filter((amenity): amenity is Amenity => Boolean(amenity));
    const merged = [...amenities];
    for (const amenity of attached) {
      if (!merged.some((item) => item.id === amenity.id)) merged.push(amenity);
    }
    merged.sort((a, b) => a.name.localeCompare(b.name));

    const ids = links.map((link) => link.amenity_id);
    setSelected(ids);
    return { catalog: merged, saved: ids };
  }, [propertyId]);

  const { data, setData, loading, error, reload } = useResource<{
    catalog: Amenity[];
    saved: string[];
  }>(fetchAmenities, { catalog: [], saved: [] });

  const { catalog, saved } = data;

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return catalog;
    return catalog.filter((amenity) =>
      amenity.name.toLowerCase().includes(term)
    );
  }, [catalog, search]);

  const dirty =
    selected.length !== saved.length ||
    selected.some((id) => !saved.includes(id));

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setPropertyAmenities(propertyId, selected);
      setData((current) => ({ ...current, saved: selected }));
      toast.success("Amenities updated");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Amenities</CardTitle>
          <CardDescription>
            Pick from the shared catalogue.{" "}
            <Link href="/admin/amenities" className="text-primary hover:underline">
              Manage the catalogue
            </Link>
            .
          </CardDescription>
        </div>
        <Badge variant="secondary">{selected.length} selected</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <LoadingBlock label="Loading amenities…" />
        ) : catalog.length === 0 ? (
          <EmptyState
            icon={<Boxes />}
            title="The catalogue is empty"
            description="Add amenities once and reuse them across every property."
            action={
              <Button asChild variant="outline">
                <Link href="/admin/amenities">Go to amenities</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search amenities"
                className="pl-9"
                aria-label="Search amenities"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No amenities match “{search}”.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((amenity) => {
                  const checked = selected.includes(amenity.id);

                  return (
                    <label
                      key={amenity.id}
                      htmlFor={`amenity-${amenity.id}`}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
                    >
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggle(amenity.id, value === true)
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <Label
                          htmlFor={`amenity-${amenity.id}`}
                          className="cursor-pointer truncate"
                        >
                          {amenity.name}
                        </Label>
                        {!amenity.is_active ? (
                          <span className="block text-xs text-muted-foreground">
                            Retired from the catalogue
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              {dirty ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelected(saved)}
                  disabled={saving}
                >
                  Reset
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
              >
                {saving ? <Spinner /> : <Save />}
                Save amenities
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

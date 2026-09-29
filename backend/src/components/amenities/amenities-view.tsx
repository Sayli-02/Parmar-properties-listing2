"use client";

import * as React from "react";
import { Boxes, Pencil, Plus, Search, Trash } from "lucide-react";
import { toast } from "sonner";

import type { Amenity } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { useResource } from "@/lib/hooks/use-resource";
import {
  countPropertiesForAmenity,
  deleteAmenity,
  listAmenities,
  setAmenityActive,
} from "@/lib/api/amenities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/shared/states";
import { ConfirmDialog, useConfirm } from "@/components/shared/confirm-dialog";
import { AmenityDialog } from "@/components/amenities/amenity-dialog";

export function AmenitiesView() {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Amenity | null>(null);
  const [linkedCount, setLinkedCount] = React.useState<number | null>(null);
  const confirm = useConfirm<Amenity>();
  const {
    data: amenities,
    setData: setAmenities,
    loading,
    error,
    reload,
  } = useResource<Amenity[]>(listAmenities, []);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return amenities;
    return amenities.filter((amenity) =>
      amenity.name.toLowerCase().includes(term)
    );
  }, [amenities, search]);

  async function askDelete(amenity: Amenity) {
    confirm.ask(amenity);
    setLinkedCount(null);
    try {
      setLinkedCount(await countPropertiesForAmenity(amenity.id));
    } catch {
      setLinkedCount(null);
    }
  }

  async function handleToggle(amenity: Amenity, isActive: boolean) {
    setAmenities((current) =>
      current.map((item) =>
        item.id === amenity.id ? { ...item, is_active: isActive } : item
      )
    );

    try {
      await setAmenityActive(amenity.id, isActive);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenities"
        description="A shared catalogue you pick from on each property, so the same facility is never spelled two different ways."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            New amenity
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-0 p-0">
          <div className="border-b border-border p-4">
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
          </div>

          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Boxes />}
              title={
                amenities.length === 0
                  ? "No amenities yet"
                  : "No amenities match that search"
              }
              description={
                amenities.length === 0
                  ? "Build up a catalogue such as clubhouse, gym and kids' play area."
                  : "Try a different word."
              }
              action={
                amenities.length === 0 ? (
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus />
                    New amenity
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="w-32">Selectable</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((amenity) => (
                  <TableRow key={amenity.id}>
                    <TableCell className="font-medium">{amenity.name}</TableCell>
                    <TableCell>
                      {amenity.icon ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {amenity.icon}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={amenity.is_active}
                        aria-label={`Allow selecting ${amenity.name}`}
                        onCheckedChange={(checked) =>
                          void handleToggle(amenity, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Edit ${amenity.name}`}
                          onClick={() => {
                            setEditing(amenity);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${amenity.name}`}
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => void askDelete(amenity)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AmenityDialog
        amenity={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={reload}
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.setOpen}
        title="Delete this amenity?"
        description={
          confirm.target
            ? linkedCount && linkedCount > 0
              ? `${confirm.target.name} is used by ${linkedCount} ${
                  linkedCount === 1 ? "property" : "properties"
                } and will be removed from all of them.`
              : `${confirm.target.name} will be removed from the catalogue.`
            : undefined
        }
        confirmLabel="Delete amenity"
        destructive
        onConfirm={async () => {
          if (!confirm.target) return;
          try {
            await deleteAmenity(confirm.target.id);
            toast.success("Amenity deleted");
            reload();
          } catch (caught) {
            toast.error(getErrorMessage(caught));
          }
        }}
      />
    </div>
  );
}

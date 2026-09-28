import type {
  AvailabilityStatus,
  InventoryStatus,
  PropertyStatus,
  PropertyType,
} from "@/types";
import {
  getAvailabilityLabel,
  getInventoryStatusLabel,
  getPropertyStatusLabel,
  getPropertyTypeLabel,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const propertyStatusVariants: Record<PropertyStatus, BadgeVariant> = {
  active: "success",
  inactive: "muted",
  sold_out: "destructive",
  upcoming: "default",
  ready_to_move: "success",
  under_construction: "warning",
};

const availabilityVariants: Record<AvailabilityStatus, BadgeVariant> = {
  available: "success",
  limited: "warning",
  sold_out: "destructive",
  coming_soon: "default",
};

const inventoryVariants: Record<InventoryStatus, BadgeVariant> = {
  available: "success",
  booked: "default",
  hold: "warning",
  sold: "destructive",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <Badge variant={propertyStatusVariants[status] ?? "muted"}>
      {getPropertyStatusLabel(status)}
    </Badge>
  );
}

export function AvailabilityBadge({
  availability,
}: {
  availability: AvailabilityStatus;
}) {
  return (
    <Badge variant={availabilityVariants[availability] ?? "muted"}>
      {getAvailabilityLabel(availability)}
    </Badge>
  );
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return (
    <Badge variant={inventoryVariants[status] ?? "muted"}>
      {getInventoryStatusLabel(status)}
    </Badge>
  );
}

export function PropertyTypeBadge({ type }: { type: PropertyType }) {
  return <Badge variant="outline">{getPropertyTypeLabel(type)}</Badge>;
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "muted"}>
      {isActive ? "Active" : "Hidden"}
    </Badge>
  );
}

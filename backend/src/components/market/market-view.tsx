"use client";

import * as React from "react";
import { Pencil, Plus, Trash, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import type { MarketIntelligence } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { useResource } from "@/lib/hooks/use-resource";
import {
  deleteMarketIntelligence,
  listMarketIntelligence,
  reorderMarketIntelligence,
  setMarketIntelligenceActive,
} from "@/lib/api/market-intelligence";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/shared/states";
import { ConfirmDialog, useConfirm } from "@/components/shared/confirm-dialog";
import { OrderControls, moveItem } from "@/components/shared/order-controls";
import { MetricDialog } from "@/components/market/metric-dialog";

export function MarketIntelligenceView() {
  const [reordering, setReordering] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MarketIntelligence | null>(null);
  const confirm = useConfirm<MarketIntelligence>();
  const {
    data: metrics,
    setData: setMetrics,
    loading,
    error,
    reload,
  } = useResource<MarketIntelligence[]>(listMarketIntelligence, []);

  async function handleMove(from: number, to: number) {
    const next = moveItem(metrics, from, to);
    if (next === metrics) return;

    setMetrics(next);
    setReordering(true);
    try {
      await reorderMarketIntelligence(next.map((metric) => metric.id));
    } catch (caught) {
      toast.error(getErrorMessage(caught));
      reload();
    } finally {
      setReordering(false);
    }
  }

  async function handleToggle(
    metric: MarketIntelligence,
    isActive: boolean
  ) {
    const previous = metrics;
    setMetrics((current) =>
      current.map((item) =>
        item.id === metric.id ? { ...item, is_active: isActive } : item
      )
    );

    try {
      const saved = await setMarketIntelligenceActive(metric.id, isActive);
      setMetrics((current) =>
        current.map((item) => (item.id === saved.id ? saved : item))
      );
    } catch (caught) {
      setMetrics(previous);
      toast.error(getErrorMessage(caught));
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market intelligence"
        description="Headline market numbers shown to buyers. Keep the source recorded so the figures stay defensible."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            New metric
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <TableSkeleton />
          ) : metrics.length === 0 ? (
            <EmptyState
              icon={<TrendingUp />}
              title="No metrics yet"
              description="Add figures such as average price growth or new launches this quarter."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus />
                  New metric
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-24">Live</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric, index) => (
                  <TableRow key={metric.id}>
                    <TableCell>
                      <OrderControls
                        index={index}
                        total={metrics.length}
                        disabled={reordering}
                        onMove={handleMove}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{metric.title}</p>
                      {metric.description ? (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {metric.value}
                      {metric.unit ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {metric.unit}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {metric.change_percentage == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge
                          variant={
                            metric.change_percentage >= 0
                              ? "success"
                              : "destructive"
                          }
                        >
                          {metric.change_percentage > 0 ? "+" : ""}
                          {metric.change_percentage}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48">
                      <span className="line-clamp-1 text-sm text-muted-foreground">
                        {metric.source || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={metric.is_active}
                        aria-label={`Show ${metric.title} on the website`}
                        onCheckedChange={(checked) =>
                          void handleToggle(metric, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Edit ${metric.title}`}
                          onClick={() => {
                            setEditing(metric);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${metric.title}`}
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => confirm.ask(metric)}
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

      <MetricDialog
        metric={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={reload}
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.setOpen}
        title="Delete this metric?"
        description={
          confirm.target
            ? `"${confirm.target.title}" will be removed from the website.`
            : undefined
        }
        confirmLabel="Delete metric"
        destructive
        onConfirm={async () => {
          if (!confirm.target) return;
          try {
            await deleteMarketIntelligence(confirm.target.id);
            toast.success("Metric deleted");
            reload();
          } catch (caught) {
            toast.error(getErrorMessage(caught));
          }
        }}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";

import type { PriceBreakdown } from "@/types";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { savePriceBreakdowns } from "@/lib/api/configurations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/states";

interface Row {
  key: string;
  label: string;
  amount: string;
}

function toRows(breakdowns: PriceBreakdown[]): Row[] {
  return breakdowns.map((row) => ({
    key: row.id,
    label: row.label,
    amount: String(row.amount),
  }));
}

function newRow(): Row {
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return { key, label: "", amount: "" };
}

/**
 * Editable cost sheet for one configuration — base price, floor rise, taxes and
 * so on. Rows are saved as a set, so reordering and removing stay simple.
 */
export function PriceBreakdownEditor({
  configurationId,
  breakdowns,
  currency,
  onSaved,
}: {
  configurationId: string;
  breakdowns: PriceBreakdown[];
  currency: string;
  onSaved: () => void;
}) {
  const [rows, setRows] = React.useState<Row[]>(() => toRows(breakdowns));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Start over from the saved rows whenever the parent reloads them.
  const [loadedFrom, setLoadedFrom] = React.useState(breakdowns);
  if (loadedFrom !== breakdowns) {
    setLoadedFrom(breakdowns);
    setRows(toRows(breakdowns));
  }

  const total = rows.reduce((sum, row) => {
    const value = Number(row.amount);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  function update(key: string, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  async function handleSave() {
    const filled = rows.filter((row) => row.label.trim() !== "");

    if (filled.some((row) => !Number.isFinite(Number(row.amount)))) {
      setError("Every amount must be a number.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await savePriceBreakdowns(
        configurationId,
        filled.map((row, index) => ({
          label: row.label.trim(),
          amount: Number(row.amount || 0),
          display_order: index,
        }))
      );
      toast.success("Price breakdown saved");
      onSaved();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Cost sheet
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRows((current) => [...current, newRow()])}
        >
          <Plus />
          Add line
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          No cost lines yet. Add base price, floor rise, GST and other charges so
          buyers see the full picture.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <Input
                value={row.label}
                placeholder="Base price"
                aria-label="Cost line label"
                onChange={(event) => update(row.key, { label: event.target.value })}
              />
              <Input
                value={row.amount}
                type="number"
                min={0}
                placeholder="0"
                className="w-36"
                aria-label="Cost line amount"
                onChange={(event) =>
                  update(row.key, { amount: event.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove cost line"
                className="text-destructive hover:bg-destructive/10"
                onClick={() =>
                  setRows((current) =>
                    current.filter((item) => item.key !== row.key)
                  )
                }
              >
                <Trash />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">
            {formatCurrency(total, currency)}
          </span>
        </p>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner /> : <Save />}
          Save cost sheet
        </Button>
      </div>
    </div>
  );
}

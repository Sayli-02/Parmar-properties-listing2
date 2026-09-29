import type { MarketIntelligence } from "@/types";
import type { MarketIntelligenceInput } from "@/lib/validations";

import { getSupabase, nullifyEmpty, throwOnError } from "./client";

const TABLE = "market_intelligence";

export async function listMarketIntelligence(): Promise<MarketIntelligence[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  throwOnError(error, "Loading market intelligence");
  return (data ?? []) as unknown as MarketIntelligence[];
}

export async function getMarketIntelligence(
  id: string
): Promise<MarketIntelligence | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error, "Loading market intelligence");
  return (data as unknown as MarketIntelligence) ?? null;
}

export async function getNextMarketOrder(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  throwOnError(error, "Loading metric order");
  const highest = (data?.[0]?.display_order as number | undefined) ?? -1;
  return highest + 1;
}

export async function createMarketIntelligence(
  input: MarketIntelligenceInput
): Promise<MarketIntelligence> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(nullifyEmpty(input))
    .select("*")
    .single();

  throwOnError(error, "Creating metric");
  return data as unknown as MarketIntelligence;
}

export async function updateMarketIntelligence(
  id: string,
  input: MarketIntelligenceInput
): Promise<MarketIntelligence> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update(nullifyEmpty(input))
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating metric");
  return data as unknown as MarketIntelligence;
}

export async function deleteMarketIntelligence(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  throwOnError(error, "Deleting metric");
}

export async function setMarketIntelligenceActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id);

  throwOnError(error, "Updating metric");
}

export async function reorderMarketIntelligence(ids: string[]): Promise<void> {
  const supabase = getSupabase();

  await Promise.all(
    ids.map(async (id, index) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ display_order: index })
        .eq("id", id);
      throwOnError(error, "Reordering metrics");
    })
  );
}

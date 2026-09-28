import type { HeroSlide } from "@/types";
import type { HeroSlideInput } from "@/lib/validations";

import { getSupabase, nullifyEmpty, throwOnError } from "./client";
import { deleteFile } from "./storage";

const TABLE = "hero_slides";

export async function listHeroSlides(): Promise<HeroSlide[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  throwOnError(error, "Loading hero slides");
  return (data ?? []) as unknown as HeroSlide[];
}

export async function getHeroSlide(id: string): Promise<HeroSlide | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error, "Loading hero slide");
  return (data as unknown as HeroSlide) ?? null;
}

export async function getNextHeroOrder(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  throwOnError(error, "Loading hero slide order");
  const highest = (data?.[0]?.display_order as number | undefined) ?? -1;
  return highest + 1;
}

export async function createHeroSlide(
  input: HeroSlideInput,
  image?: { path: string; url: string } | null
): Promise<HeroSlide> {
  const supabase = getSupabase();
  const payload = {
    ...nullifyEmpty(input),
    image_path: image?.path ?? null,
    image_url: image?.url ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwOnError(error, "Creating hero slide");
  return data as unknown as HeroSlide;
}

export async function updateHeroSlide(
  id: string,
  input: HeroSlideInput,
  image?: { path: string; url: string } | null
): Promise<HeroSlide> {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = nullifyEmpty(input);

  // `undefined` means "leave the current image alone"; null means "remove it".
  if (image !== undefined) {
    payload.image_path = image?.path ?? null;
    payload.image_url = image?.url ?? null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating hero slide");
  return data as unknown as HeroSlide;
}

export async function deleteHeroSlide(slide: HeroSlide): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", slide.id);

  throwOnError(error, "Deleting hero slide");
  await deleteFile(slide.image_path);
}

export async function setHeroSlideActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: isActive })
    .eq("id", id);

  throwOnError(error, "Updating hero slide");
}

/**
 * Persists a new order for the given ids, in array order.
 */
export async function reorderHeroSlides(ids: string[]): Promise<void> {
  const supabase = getSupabase();

  await Promise.all(
    ids.map(async (id, index) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ display_order: index })
        .eq("id", id);
      throwOnError(error, "Reordering hero slides");
    })
  );
}

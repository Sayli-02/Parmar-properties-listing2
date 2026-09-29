import type {
  ArticleSection,
  InsightsArticle,
  InsightsArticleWithRelations,
  InsightsFilters,
  LookupItem,
  PaginatedResult,
} from "@/types";
import type {
  ArticleSectionInput,
  InsightsArticleInput,
} from "@/lib/validations";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import {
  getSupabase,
  nullifyEmpty,
  sanitizeSearch,
  throwOnError,
} from "./client";
import { listLookupArticleCategories } from "./lookups";

const TABLE = "insights_articles";
const SECTIONS_TABLE = "article_sections";

function toPayload(input: InsightsArticleInput): Record<string, unknown> {
  return {
    ...nullifyEmpty({
      title: input.title,
      slug: input.slug,
      category_header: input.category_header,
      category_id: input.category_id,
      subtitle: input.subtitle,
      description: input.description,
      tag: input.tag,
      date_tag: input.date_tag,
      image_path: input.image_path,
      author_name: input.author_name,
      author_role: input.author_role,
      author_desk: input.author_desk,
      status: input.status,
      sort_order: input.sort_order,
      meta_title: input.meta_title,
      meta_description: input.meta_description,
    }),
    // NOT NULL text columns — keep empty string rather than null
    subtitle: input.subtitle || "",
    tag: input.tag || "",
    date_tag: input.date_tag || "",
    image_path: input.image_path || "",
    author_role: input.author_role || "",
    author_desk: input.author_desk || "Parmar Properties Research",
    key_takeaways: input.key_takeaways ?? [],
  };
}

export async function listInsightsArticles(
  filters: InsightsFilters = {}
): Promise<PaginatedResult<InsightsArticleWithRelations>> {
  const supabase = getSupabase();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(TABLE).select("*", { count: "exact" });

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      [
        `title.ilike.%${search}%`,
        `slug.ilike.%${search}%`,
        `category_header.ilike.%${search}%`,
        `tag.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category_id) query = query.eq("category_id", filters.category_id);

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "updated":
      query = query.order("updated_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(from, to);
  throwOnError(error, "Loading insights articles");

  const rows = (data ?? []) as unknown as InsightsArticle[];
  const withRelations = await attachCategories(rows);
  const total = count ?? 0;

  return {
    data: withRelations,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function attachCategories(
  rows: InsightsArticle[]
): Promise<InsightsArticleWithRelations[]> {
  if (rows.length === 0) return [];
  const categories = await listLookupArticleCategories(false);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return rows.map((row) => ({
    ...row,
    category: byId.get(row.category_id) ?? null,
  }));
}

export async function getInsightsArticle(
  id: string
): Promise<InsightsArticleWithRelations | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error, "Loading insights article");
  if (!data) return null;

  const article = data as unknown as InsightsArticle;
  const [withCategory] = await attachCategories([article]);
  const sections = await listArticleSections(id);
  return { ...withCategory, sections };
}

export async function isInsightsSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase();
  let query = supabase.from(TABLE).select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  throwOnError(error, "Checking the slug");
  return (data ?? []).length === 0;
}

export async function createInsightsArticle(
  input: InsightsArticleInput
): Promise<InsightsArticle> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toPayload(input))
    .select("*")
    .single();

  throwOnError(error, "Creating insights article");
  return data as unknown as InsightsArticle;
}

export async function updateInsightsArticle(
  id: string,
  input: InsightsArticleInput
): Promise<InsightsArticle> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update(toPayload(input))
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating insights article");
  return data as unknown as InsightsArticle;
}

export async function deleteInsightsArticle(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  throwOnError(error, "Deleting insights article");
}

export async function listArticleSections(
  articleId: string
): Promise<ArticleSection[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(SECTIONS_TABLE)
    .select("*")
    .eq("article_id", articleId)
    .order("section_order", { ascending: true });

  throwOnError(error, "Loading article sections");
  return (data ?? []) as unknown as ArticleSection[];
}

export async function createArticleSection(
  articleId: string,
  input: ArticleSectionInput
): Promise<ArticleSection> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(SECTIONS_TABLE)
    .insert({
      article_id: articleId,
      heading: input.heading,
      paragraphs: input.paragraphs ?? [],
      table_data: input.table_data ?? null,
      highlight_quote: input.highlight_quote || null,
      section_order: input.section_order ?? 0,
    })
    .select("*")
    .single();

  throwOnError(error, "Creating article section");
  return data as unknown as ArticleSection;
}

export async function updateArticleSection(
  id: string,
  input: ArticleSectionInput
): Promise<ArticleSection> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(SECTIONS_TABLE)
    .update({
      heading: input.heading,
      paragraphs: input.paragraphs ?? [],
      table_data: input.table_data ?? null,
      highlight_quote: input.highlight_quote || null,
      section_order: input.section_order ?? 0,
    })
    .eq("id", id)
    .select("*")
    .single();

  throwOnError(error, "Updating article section");
  return data as unknown as ArticleSection;
}

export async function deleteArticleSection(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(SECTIONS_TABLE).delete().eq("id", id);
  throwOnError(error, "Deleting article section");
}

export async function reorderArticleSections(
  orderedIds: string[]
): Promise<void> {
  const supabase = getSupabase();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from(SECTIONS_TABLE)
        .update({ section_order: index })
        .eq("id", id)
        .then(({ error }) => throwOnError(error, "Reordering sections"))
    )
  );
}

export async function listInsightsFormLookups(): Promise<{
  categories: LookupItem[];
}> {
  return { categories: await listLookupArticleCategories() };
}

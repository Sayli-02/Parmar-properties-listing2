import { getSupabase } from './client';
import { INSIGHTS_ARTICLES, InsightArticle } from '@/data/insights';

export function mapDbArticleToFrontend(row: Record<string, any>): InsightArticle {
  const sections = (row.sections || []).map((sec: any) => ({
    heading: sec.heading,
    content: Array.isArray(sec.paragraphs) ? sec.paragraphs : [],
    tableData: sec.table_data ? {
      headers: sec.table_data.headers || [],
      rows: sec.table_data.rows || [],
    } : undefined,
    highlight: sec.highlight_quote || undefined,
  }));

  // Derive read time based on word count (Spec Section 3E)
  const totalWords = (row.description || '').split(/\s+/).length +
    sections.reduce((acc: number, s: any) => acc + s.content.join(' ').split(/\s+/).length, 0);
  const readTime = `${Math.max(3, Math.ceil(totalWords / 180))} min read`;

  return {
    id: row.id,
    slug: row.slug,
    category: row.category_header || row.category?.name || 'MARKET INSIGHTS',
    categorySlug: (row.category?.slug || 'location') as any,
    title: row.title,
    subtitle: row.subtitle || '',
    description: row.description || '',
    readTime,
    tag: row.tag || 'Analysis',
    date: row.date_tag || '2026 Benchmark',
    image: row.image_path || '/properties/worli-aurum/cover.jpg',
    author: {
      name: row.author_name || 'Advisory Research Desk',
      role: row.author_role || 'Head of Prime Residential Valuation',
      desk: row.author_desk || 'Parmar Properties Research',
    },
    keyTakeaways: Array.isArray(row.key_takeaways) ? row.key_takeaways : [],
    sections: sections.length > 0 ? sections : [
      {
        heading: 'Executive Overview',
        content: [row.description || 'Detailed micro-market evaluation.'],
      },
    ],
  };
}

export async function fetchInsightsArticles(): Promise<InsightArticle[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return INSIGHTS_ARTICLES;
  }

  try {
    const { data, error } = await supabase
      .from('insights_articles')
      .select('*, category:lookup_article_categories(name, slug), sections:article_sections(*)')
      .eq('status', 'published')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return INSIGHTS_ARTICLES;
    }

    return data.map(mapDbArticleToFrontend);
  } catch (err) {
    console.warn('Failed to fetch articles from Supabase, using fallback:', err);
    return INSIGHTS_ARTICLES;
  }
}

export async function fetchArticleBySlug(slug: string): Promise<InsightArticle | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return INSIGHTS_ARTICLES.find((a) => a.slug === slug || a.id === slug) || null;
  }

  try {
    const { data, error } = await supabase
      .from('insights_articles')
      .select('*, category:lookup_article_categories(name, slug), sections:article_sections(*)')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      return INSIGHTS_ARTICLES.find((a) => a.slug === slug || a.id === slug) || null;
    }

    return mapDbArticleToFrontend(data);
  } catch (err) {
    console.warn(`Failed to fetch article ${slug} from Supabase:`, err);
    return INSIGHTS_ARTICLES.find((a) => a.slug === slug || a.id === slug) || null;
  }
}

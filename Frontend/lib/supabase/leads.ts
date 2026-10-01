import { getSupabase } from './client';

export type LeadSourceSlug =
  | 'navbar_advisory'
  | 'private_opportunities_otp'
  | 'property_gate_modal'
  | 'property_sidebar_inquiry'
  | 'commercial_card_modal'
  | 'article_consultation_modal';

export interface SubmitLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  sourceSlug: LeadSourceSlug;
  propertyId?: string;
  propertySlug?: string;
  commercialId?: string;
  articleId?: string;
  assetClass?: string;
  budgetRange?: string;
  message?: string;
  gateType?: string;
  isOtpVerified?: boolean;
}

// In-memory cache for source slug -> UUID mapping so we don't query repeatedly
const sourceIdCache: Record<string, string> = {};

async function resolveSourceId(sourceSlug: LeadSourceSlug): Promise<string | null> {
  if (sourceIdCache[sourceSlug]) {
    return sourceIdCache[sourceSlug];
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('lookup_lead_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .maybeSingle();

    if (data?.id) {
      sourceIdCache[sourceSlug] = data.id;
      return data.id;
    }

    // Fallback: if exact slug is missing, pick the first available source in the table so lead is never dropped
    const { data: firstAvailable } = await supabase
      .from('lookup_lead_sources')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstAvailable?.id) {
      return firstAvailable.id;
    }
  } catch (err) {
    console.warn('Failed to resolve lead source ID for slug:', sourceSlug, err);
  }

  return null;
}

export async function submitLead(payload: SubmitLeadPayload): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  // If Supabase is unconfigured or offline, save locally and return success so UX is not blocked
  if (!supabase) {
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('parmar_offline_leads') || '[]');
        stored.push({ ...payload, submittedAt: new Date().toISOString() });
        localStorage.setItem('parmar_offline_leads', JSON.stringify(stored));
      }
    } catch {
      // localStorage error fallback
    }
    return { success: true };
  }

  try {
    const sourceId = await resolveSourceId(payload.sourceSlug);

    // If sourceId is not yet in lookup table, fall back gracefully
    const record: Record<string, unknown> = {
      full_name: payload.fullName.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      company_name: payload.companyName?.trim() || null,
      asset_class: payload.assetClass || null,
      budget_range: payload.budgetRange || null,
      message: payload.message?.trim() || null,
      gate_type: payload.gateType || null,
      is_otp_verified: Boolean(payload.isOtpVerified),
    };

    if (sourceId) {
      record.source_id = sourceId;
    }

    if (payload.propertyId) {
      record.property_id = payload.propertyId;
    }
    if (payload.commercialId) {
      record.commercial_id = payload.commercialId;
    }
    if (payload.articleId) {
      record.article_id = payload.articleId;
    }

    const { error } = await supabase.from('leads').insert(record);

    if (error) {
      console.error('Supabase lead submission error:', error);
      // Still store in localStorage for safety
      try {
        if (typeof window !== 'undefined') {
          const stored = JSON.parse(localStorage.getItem('parmar_offline_leads') || '[]');
          stored.push({ ...payload, submittedAt: new Date().toISOString(), dbError: error.message });
          localStorage.setItem('parmar_offline_leads', JSON.stringify(stored));
        }
      } catch {
        // Storage fail
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown lead submission failure';
    console.error('Exception submitting lead:', message);
    return { success: false, error: message };
  }
}

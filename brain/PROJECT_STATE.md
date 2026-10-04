# Parmar Properties — Project State & System Status

> **Last Updated:** October 4, 2026  
> **Status:** Backend Admin Complete | Frontend UI Complete | Home CMS sections wired (Locations/Hero/Why/Insights) | RLS publication_status migration authored (010, not yet applied)  
> **Repository:** `https://github.com/Sayli-02/Parmar-properties-listing2.git`  
> **Main Branch Commit:** `87c5d1f` (*Complete backend admin CMS*)

---

## 1. System Overview & Architecture

```
                             ┌──────────────────────────────┐
                             │      Supabase (Cloud)        │
                             │   PostgreSQL + Storage Auth  │
                             └──────────────┬───────────────┘
                                            │
                  ┌─────────────────────────┴─────────────────────────┐
                  │ (Full CRUD / Admin writes)                         │ (Public reads & Lead inserts)
                  ▼                                                   ▼
      ┌─────────────────────────┐                         ┌─────────────────────────┐
      │   backend (Admin CMS)   │                         │  Frontend (Public Web)  │
      │   Next.js 16 + React 19 │                         │  Next.js 14 + React 18  │
      │   Tailwind CSS v4       │                         │  Tailwind CSS v3        │
      │   Supabase SSR Client   │                         │  Zustand, Lucide-react  │
      └─────────────────────────┘                         └─────────────────────────┘
```

---

## 2. Module Breakdown & Current Status

### A. Backend Admin CMS (`/backend`) — ✅ 100% Complete
- **Tech Stack:** Next.js 16.3.6 (App Router), React 19, Tailwind CSS v4, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `react-hook-form`, `sonner`, `lucide-react`.
- **Role:** Private administration interface for staff to manage listings, editorial content, site settings, and process incoming leads.
- **Implemented Panels:**
  - `Dashboard`: Live inventory counts, active/featured metrics, locality breakdown.
  - `Properties`: Complete residential listing editor (media, floor plans, 2/3/4/5 BHK configuration variants, price breakdowns, RERA ID & QR image, interactive map coordinate picker).
  - `Commercials`: Commercial listing manager (Grade-A offices, corporate HQs, commercial hubs, grades).
  - `Locations`: Micro-market editor (benchmarks, price ranges, average rate/sq.ft, lifestyle tags, key enclaves).
  - `Insights (Market Intelligence)`: Full article editor with dynamic section builder, data tables, and pull quotes.
  - `Hero Slides`: Home page carousel slides editor (heading, supporting text, CTA label & URL, image uploader).
  - `Featured Properties`: Drag-and-drop / ordering of home page featured properties.
  - `Amenities`: Catalog of shared residential & luxury amenities with icon mappings.
  - `Settings`: Singleton editor for `site_branding` (brand name, EST badge, office address, contact numbers, email, MahaRERA firm registration, social links).
  - `Page Content`: Dynamic editor for per-route copy (`home`, `buy`, `new-launches`, `luxury-collection`, `commercials`, `locations`, `insights`, `about`, `compare`, `saved`).
  - `Leads`: Inbox for all enquiries received across the site, with pipeline status management and advisor assignment.

### B. Database & Migrations (`backend/supabase`) — ✅ 100% Defined
- Complete set of additive SQL migrations ready to run on any Supabase project:
  1. `001_initial_schema.sql`: Core tables, enums, triggers, RLS policies.
  2. `002_storage.sql`: Public `media` storage bucket and file upload policies.
  3. `003_fix_authorization.sql`: Security hardening, non-recursive profile RLS.
  4. `004_master_schema.sql`: Lookup catalogues, `page_content`, consolidated `leads` inbox.
  5. `005_master_collections.sql`: `site_branding`, `commercial_properties`, `insights_articles`, `article_sections`.
  6. `006_evolve_properties_locations.sql`: Master columns on properties and locations, `property_configurations` layout variants.
  7. `007_content_completeness.sql`: Luxury collection flag, 2 BHK lookup, audit fields.
  8. `008_property_configuration_price_breakdowns.sql`: Cost-sheet line items for configurations.
  9. `009_add_property_flow.sql`: 1 BHK variants + exclusive amenity `custom_label`.
  10. `010_publication_status_rls.sql`: Public property RLS gates on `publication_status` + `deleted_at` (authored; apply in Supabase when ready).
  - `seed_master.sql`: Populates master catalogues and baseline page content.
  - `seed.sql`: Sample records for demonstration.
  - `seed_cms_frontend_content.sql`: Migrates existing Frontend Mumbai hero/why/locations/insights content into live CMS tables (applied to linked Supabase).

### C. Frontend Luxury Portal (`/Frontend`) — ✅ UI & Wiring Complete
- **Tech Stack:** Next.js 14.2.35 (App Router), React 18.3, Tailwind CSS v3, Zustand 4.5, Lucide-react.
- **Role:** High-end public client portal for ultra-luxury Mumbai real estate.
- **Current State:**
  - All 11 pages and 6 lead capture modals are fully built, styled, and responsive.
  - `@supabase/supabase-js` installed in `Frontend/package.json`.
  - Supabase client initialized in [`Frontend/lib/supabase/client.ts`](file:///c:/Users/Sayli/OneDrive/Desktop/Parmar-properties-listing/Frontend/lib/supabase/client.ts).
  - **All 6 lead touchpoints are wired** to insert inquiries directly into the Supabase `leads` table.
  - **Dynamic queries wired with zero-breakage hybrid fallback:**
    - Residential properties & featured showcases ([`Frontend/lib/supabase/properties.ts`](../Frontend/lib/supabase/properties.ts))
    - Commercial properties ([`Frontend/lib/supabase/commercials.ts`](../Frontend/lib/supabase/commercials.ts))
    - Locations directory, filter bar, primary/future home cards ([`Frontend/lib/supabase/locations.ts`](../Frontend/lib/supabase/locations.ts))
    - Hero slides + home page_content ([`Frontend/lib/supabase/hero.ts`](../Frontend/lib/supabase/hero.ts), [`Frontend/lib/supabase/page-content.ts`](../Frontend/lib/supabase/page-content.ts))
    - Why Parmar metrics/pillars from `page_content` ([`Frontend/components/home/WhyParmar.tsx`](../Frontend/components/home/WhyParmar.tsx))
    - Market intelligence articles + home preview ([`Frontend/lib/supabase/insights.ts`](../Frontend/lib/supabase/insights.ts))
  - Full production build compiles with **0 errors** across all 29 routes.

---

## 3. The Core Goal: "Wiring" Frontend to Backend

Supabase serves as the direct, secure data layer with Row Level Security:
1. **Frontend Supabase Client:** `@supabase/supabase-js` configured with singleton client.
2. **Hybrid Fallback Pattern:** Query functions fetch live Supabase rows and automatically fall back to static data if tables are empty or offline.
3. **Connect Lead Modals (Priority 1):** All 6 lead forms insert directly into the Supabase `leads` table.
4. **Connect Dynamic Listings (Priority 2):** Live published properties, commercials, locations, and articles hydrate on the public pages.

---

## 4. Environment Variables Configuration

Both Frontend and Backend share the same Supabase project (`wmnptubgyikrwpbsckdn`).

- [x] Files created and active: [`backend/.env.local`](file:///c:/Users/Sayli/OneDrive/Desktop/Parmar-properties-listing/backend/.env.local) and [`Frontend/.env.local`](file:///c:/Users/Sayli/OneDrive/Desktop/Parmar-properties-listing/Frontend/.env.local)
- [x] Values populated: `https://wmnptubgyikrwpbsckdn.supabase.co` with valid public anon key.
- [x] Verified live database connectivity without errors.

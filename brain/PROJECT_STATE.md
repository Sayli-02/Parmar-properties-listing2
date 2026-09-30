# Parmar Properties — Project State & System Status

> **Last Updated:** September 30, 2026  
> **Status:** Backend Admin Complete | Frontend UI Complete | Wiring in Progress  
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
  - `seed_master.sql`: Populates master catalogues and baseline page content.
  - `seed.sql`: Sample records for demonstration.

### C. Frontend Luxury Portal (`/Frontend`) — 🟡 UI Complete, Needs Wiring
- **Tech Stack:** Next.js 14.2.15 (App Router), React 18.3, Tailwind CSS v3, Zustand 4.5, Lucide-react.
- **Role:** High-end public client portal for ultra-luxury Mumbai real estate.
- **Current State:**
  - All 11 pages and 6 lead capture modals are fully built, styled, and responsive.
  - **The Missing Link:** Data is currently imported from local static files (`Frontend/data/properties.ts`, `commercials.ts`, `insights.ts`, `content/*`).
  - Forms store lead details into browser `localStorage` and display mock success badges.
  - `@supabase/supabase-js` is not yet installed in `Frontend/package.json`.

---

## 3. The Core Goal: "Wiring" Frontend to Backend

To wire the project, we do NOT change backend API routes because Supabase serves as the direct data layer with Row Level Security:
1. **Frontend Supabase Client:** Install `@supabase/supabase-js` in `Frontend`, create `Frontend/lib/supabase/client.ts`.
2. **Hybrid Fallback Pattern:** Build query functions with graceful fallbacks. If Supabase is unconfigured or offline, fallback to `Frontend/data/*.ts` so the frontend NEVER breaks.
3. **Connect Lead Modals (Priority 1):** Point all 6 lead forms to insert directly into the Supabase `leads` table.
4. **Connect Dynamic Listings (Priority 2):** Fetch live published properties, commercials, locations, articles, and hero slides from Supabase.

---

## 4. Required Environment Variables

Both Frontend and Backend share the same Supabase project:

### `backend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### `Frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```
*(Both variables are safe for the browser; Supabase RLS protects the database).*

# Parmar Properties — Task Board & Sprint Tracker 📌

> **Instructions for the 3 Developers:**  
> When you start working on a task:
> 1. Change its status to 🔄 **In Progress** and put your name in **Assigned:**.
> 2. When finished, move it to ✅ **Completed** and log the work in [`TEAM_LOG.md`](./TEAM_LOG.md).
> 3. Never work on a task marked 🔄 **In Progress** by another teammate without communicating first!

---

## 🚀 Active Sprint: Frontend & Backend Wiring

### 1. In Progress 🔄
*(Claim a task by adding your name here)*

- [ ] **Task 2.1: Frontend Supabase Client & Adapter Setup**
  - **Status:** 🔄 Ready to Start / In Progress
  - **Assigned:** `[Developer Name]`
  - **Description:** Install `@supabase/supabase-js` in `Frontend`, create `Frontend/lib/supabase/client.ts`, and set up TypeScript type mapper functions.
  - **Definition of Done:** Supabase client initializes safely without build or runtime errors.

---

### 2. To Do (Upcoming Tasks) 📋

#### Phase 1: Lead Capture Forms (Direct to Supabase `leads`)
- [ ] **Task 3.1: Navbar Advisory Modal Submission**
  - **Assigned:** `[Unassigned]`
  - **File:** `Frontend/components/layout/Navbar.tsx`
  - **Goal:** On submit, insert lead into Supabase `leads` table with `source = 'navbar_advisory'`.
- [ ] **Task 3.2: Property Detail Sticky Sidebar Inquiry Form**
  - **Assigned:** `[Unassigned]`
  - **File:** `Frontend/components/property/PropertyDetailClient.tsx`
  - **Goal:** On submit, insert lead into Supabase with `property_id` and message.
- [ ] **Task 3.3: Property Detail Gated Modal (Brochure / Floor Plan / Map Unlock)**
  - **Assigned:** `[Unassigned]`
  - **File:** `Frontend/components/property/PropertyDetailClient.tsx`
  - **Goal:** Insert lead with `gate_type` (`brochure`, `floorplan`, `map`, `viewing`).
- [ ] **Task 3.4: Home Private Opportunities OTP Gate**
  - **Assigned:** `[Unassigned]`
  - **File:** `Frontend/components/property/PrivateOpportunities.tsx`
  - **Goal:** Insert lead with `is_otp_verified = true` and `source = 'private_opportunities_otp'`.
- [ ] **Task 3.5: Commercial Dossier Inquiry Modal**
  - **Assigned:** `[Unassigned]`
  - **File:** `Frontend/app/commercials/page.tsx`
  - **Goal:** Insert lead with `commercial_id` and company details.
- [ ] **Task 3.6: Market Intelligence Advisory Consultation Modal**
  - **Assigned:** `[Unassigned]`
  - **File:** `Frontend/app/market-intelligence/[slug]/page.tsx`
  - **Goal:** Insert lead with `article_id` and portfolio evaluation note.

#### Phase 2: Live Content & Listings (Hybrid Fallback Pattern)
- [ ] **Task 4.1: Residential Properties Query Hook**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/app/properties/page.tsx`, `Frontend/app/page.tsx`
  - **Goal:** Query published properties from Supabase `properties` table. If table is empty or offline, fallback to `PROPERTIES` in `data/properties.ts`.
- [ ] **Task 4.2: Single Property Dossier (`/properties/[slug]`)**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/app/properties/[slug]/page.tsx`
  - **Goal:** Fetch property by slug with `property_configurations` and `property_images`.
- [ ] **Task 4.3: Commercial Properties Query Hook (`/commercials`)**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/app/commercials/page.tsx`
  - **Goal:** Fetch published commercial properties from `commercial_properties`.
- [ ] **Task 4.4: Locations Directory & Detail (`/locations`, `/locations/[slug]`)**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/app/locations/page.tsx`, `Frontend/app/locations/[slug]/page.tsx`
  - **Goal:** Fetch locations from Supabase `locations` table.
- [ ] **Task 4.5: Market Intelligence Articles (`/market-intelligence`)**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/app/market-intelligence/page.tsx`, `[slug]/page.tsx`
  - **Goal:** Fetch published articles from `insights_articles` and `article_sections`.

#### Phase 3: Global Settings & Branding
- [ ] **Task 5.1: Dynamic Header & Footer Branding**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/components/layout/Navbar.tsx`, `Frontend/components/layout/Footer.tsx`
  - **Goal:** Read phone, email, office address, and MahaRERA number from `site_branding` table.
- [ ] **Task 5.2: Dynamic Hero Carousel Slides**
  - **Assigned:** `[Unassigned]`
  - **Files:** `Frontend/components/hero/HeroCarousel.tsx`
  - **Goal:** Read active slides from `hero_slides` table.

---

### 3. Completed Tasks ✅

- [x] **Audit Frontend and Backend Architecture & Attributes** — *Completed by Antigravity & Sayli (2026-09-30)*
- [x] **Setup Project Brain & Team Collaboration System** — *Completed by Antigravity & Sayli (2026-09-30)*
- [x] **Pull `backend-completion` and Fast-Forward Merge to `main`** — *Completed by Sayli (2026-09-30)*
- [x] **Backend Admin CMS Panels Implementation (Properties, Commercials, Locations, Insights, Leads, Hero, Settings)** — *Completed (87c5d1f)*
- [x] **Database Migrations 001 through 008 + Master Seed Scripts** — *Completed (backend/supabase/migrations)*
- [x] **Frontend 11 Routes & 6 Lead Modal UI Implementations** — *Completed*

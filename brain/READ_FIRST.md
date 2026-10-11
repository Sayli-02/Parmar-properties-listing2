# READ FIRST — before you code (people and AI agents)

> Added 2026-10-11 with the `fix/audit-hardening` branch. Delete an item once everyone has done it.

## 1. Your database needs migrations 012 to 015

The code on this branch expects database changes that older Supabase projects do not have. Run these files in order in **your own** Supabase SQL editor (Dashboard > SQL Editor), from `backend/supabase/migrations/`:

| File | What it does | What breaks without it |
| :--- | :--- | :--- |
| `012_security_hardening.sql` | New signups are created **inactive** (they cannot pass `is_admin()`). | Anyone with the public key can sign up as an active admin. |
| `013_leads_policy.sql` | Public lead inserts must be unverified and unassigned. | Anyone can insert a lead marked OTP-verified. |
| `014_listing_fixes.sql` | Adds `properties.price_on_request`, property type `Apartment`, status `Ready (OC received)`, and an unpublished Mahalaxmi page. | **Saving a property in the admin fails** (unknown column). |
| `015_ppc_lead_source.sql` | Adds lead source `google_ppc_landing`. | Leads from the PPC landing pages fail (source is required). |

Also, in Supabase **Authentication > Providers > Email**, turn off **"Allow new users to sign up"**, then activate real staff with:
`update public.profiles set is_active = true where email = '...';`

Then run `backend/supabase/tests/012_security.sql` in the SQL editor. It rolls back and should finish without an error.

## 2. Two Supabase projects exist. Do not mix them

- The original team project and a separate project used for the audit work. **No project URL or key is committed.** Each developer's `.env.local` (in `Frontend/` and `backend/`, git-ignored) decides which project their apps use.
- Never paste keys into the repo, the brain files, or chat. `.env.example` is a template only.
- `Frontend/next.config.mjs` now allows images from whichever project `NEXT_PUBLIC_SUPABASE_URL` points at (it used to hard-code one project).

## 3. Migration numbers

Migrations 001-015 are taken. If you write a new one, use **016 or higher** and check the branch and open PRs first so two people do not both create the same number. Never edit an existing migration: add a new one.

## 4. `backend/supabase/.temp/` is no longer tracked

It holds per-machine Supabase CLI link data and is now in `.gitignore`. After you pull, your local copy may be removed. Run `supabase link --project-ref <your project>` again from `backend/` if you use the CLI.

## 5. What changed that you will notice

- **Listings default to Draft.** Only Published listings are visible on the public site, the catalogue and the new pages below. Pages refresh within 60 seconds of a change.
- **Admin: Price on Request switch** per listing (the number is kept, the public site shows "Price on Request").
- **Public site:** possession date shown, exclusive amenities shown, SEO title and description come from the admin fields, the catalogue locality filter is built from the listings, and the site no longer shows fake images or fake floor or tower names.
- **New Google PPC pages:** `/ads-manager` builds a Final URL and tracking suffix per published property. `/<property-slug>/project` is a fixed-layout landing page (no site nav, hidden from search engines) with a callback form. Leads from it use source `google_ppc_landing` and keep the utm/gclid parameters.
- **Leads:** public forms send `is_otp_verified = false` until a real OTP flow exists. When it does, verify server-side and then relax migration 013.
- **Admin Media tab:** reordering images and floor plans no longer reloads the page; drag one card onto another to swap. Use `refresh()` from `useResource`, not `reload()`, for saves inside an already-loaded screen.
- Removed: the fake client login on the Saved page and the unused `/api/enquire` route.

## 6. Still open (see `TASK_BOARD.md`)

Real OTP, owner decisions (homepage Featured fallback, hard-coded "From ₹X Cr" on location cards, property type for the 8 draft listings, office details, Pune sample data in `seed.sql`), images and plans for the 8 draft listings, deferred audit items. Full findings: `AUDIT_8_LISTINGS.md`; plan: `FIX_PLAN.md`.

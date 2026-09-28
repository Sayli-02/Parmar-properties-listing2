# Parmar Properties — Admin CMS

The content management system behind the Parmar Properties website. Staff sign in
here to manage property listings, the home page hero, location pages, market
statistics and business details. Everything is stored in Supabase, so the public
website reads the same tables this admin writes to.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4 and Supabase.

---

## Getting started

### 1. Create the Supabase project

Create a project at [supabase.com](https://supabase.com), then open the SQL
editor and run, in order:

| File                                      | What it does                                                         |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `supabase/migrations/001_initial_schema.sql` | Tables, enums, triggers and row level security policies           |
| `supabase/migrations/002_storage.sql`     | The public `media` storage bucket and its access policies            |
| `supabase/seed.sql`                       | Optional sample properties, locations, amenities and metrics         |

The seed can be run more than once without creating duplicates.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
**Project Settings → API**. Both are safe in the browser: row level security,
not secrecy, is what protects the data.

### 3. Create the first admin

Supabase does not allow public sign-ups here, so the first account is made by
hand:

1. **Authentication → Users → Add user**, with an email and password.
2. A `profiles` row is created automatically by a trigger. Promote it in the SQL
   editor:

   ```sql
   UPDATE profiles SET role = 'admin', is_active = true WHERE email = 'you@example.com';
   ```

Only rows with `role = 'admin'` and `is_active = true` can write anything. An
account that signs in without those flags sees the admin with a banner
explaining that access has not been granted.

### 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); you will land on
`/admin/dashboard`, or on `/admin/login` if you are not signed in yet.

---

## Scripts

| Command             | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Development server (Turbopack)                      |
| `npm run build`     | Production build, including a TypeScript check       |
| `npm start`         | Serve the production build                          |
| `npm run typecheck` | TypeScript only, no build                           |
| `npm run lint`      | ESLint (Next.js 16 no longer lints during `build`)   |

---

## What you can manage

**Dashboard** — counts of live, hidden and featured properties, inventory status,
a breakdown by property type and locality, and shortcuts to recently updated
listings.

**Properties** — the main surface. The list supports search, filters by status,
type, location, availability and featured flag, plus sorting and pagination. Each
property opens into a tabbed editor:

- **Details** — names, slug, pricing, developer copy, RERA number, and a map
  picker for the pin used on the website
- **Images** — drag-and-drop gallery with reordering, alt text and a primary
  image that becomes the listing thumbnail
- **Configurations** — unit types with their own pricing, plus a cost sheet
  (base price, floor rise, taxes, registration) that totals as you type
- **Plans** — master plans, floor plans and configuration plans, as images or PDFs
- **Amenities** — tick items from the shared catalog; the order here is the order
  the website shows
- **Inventory** — individual units with floor, facing, price and status, with bulk
  creation for a whole floor or wing
- **Documents** — brochure and RERA QR code uploads

**Featured Properties** — arranges the properties highlighted on the home page.

**Trash** — deleted properties are kept here. Restoring brings a listing back as
hidden; deleting forever also removes its images and documents from storage.

**Hero Section**, **Locations**, **Market intelligence** — the editable sections of
the home page, each with ordering and a live/hidden toggle.

**Amenities** — the shared catalog. Deleting an amenity that properties use warns
you first and tells you how many are affected.

**Settings** — business name, contact details, office address, currency and social
links, plus your own profile and password.

---

## How the code is organised

```
src/
  app/
    admin/
      login/            Sign-in page
      (panel)/          Everything behind the sidebar shell
    page.tsx            Redirects to the dashboard
  components/
    ui/                 Buttons, inputs, dialogs, tables — the design system
    shared/             Media picker, confirm dialog, pagination, empty states
    admin/              Sidebar, shell, login form
    <feature>/          One folder per admin section
  lib/
    api/                One module per table: every query and mutation lives here
    supabase/           Browser and server clients, session refresh
    validations/        Zod schemas shared by every form
    constants/          Enum labels, page sizes, upload limits
  types/                Domain types matching the database
supabase/
  migrations/           Schema and storage setup
  seed.sql              Sample content
```

A few conventions worth knowing before you add a feature:

**Pages are thin.** Each route file sets its `metadata` and renders one client
view component. The work happens in `src/components/<feature>/`.

**All data access goes through `src/lib/api/`.** Components never build a
Supabase query themselves. Each service function returns domain types from
`src/types`, so a component only deals with plain objects. Reads and writes run
from the browser against the anon key, and row level security is the
authorization boundary — `src/proxy.ts` refreshes the session and keeps signed-out
visitors out of `/admin`.

**Uploads are deferred until save.** `MediaPicker` hands back a `FileSelection`
(`unchanged`, `remove`, or `replace`) rather than uploading immediately, and
`uploadSelection` runs on submit. Cancelling a form leaves no orphaned files in
storage.

**Deleting a property is reversible.** `softDeleteProperty` sets `deleted_at`;
only `purgeProperty` removes rows and storage objects.

**Forms are React Hook Form plus the Zod schema for that entity.** If you add a
field, add it to the schema in `src/lib/validations/` first — the form types,
validation messages and the API payload all follow from it.

---

## Deploying

Any host that runs Next.js works. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in the host's environment and run
`npm run build`. In Supabase, add the deployed origin under **Authentication →
URL Configuration** so password reset links come back to the right place.

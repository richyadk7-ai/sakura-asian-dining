# Sakura Asian Dining & Bar

A production-ready bilingual Next.js website for さくらアジアンダイニング&バー in Takadanobaba. The public site works in full without a backend; Supabase activates the protected owner publishing workflow.

## Launch status

- Phase 1 public website: implemented with `/en` and `/ja` routes, all audited menu records, five exact course links, internal bilingual reservation requests, responsive design, accessibility, SEO, tests and static content fallback.
- Phase 2 owner tools: implemented at `/admin` and `/admin/reservations` with Supabase SSR auth, owner allowlist, RLS, reservation management, drafts, explicit publishing and private authorized-original uploads.
- Restaurant photography: 55 unique official restaurant-uploaded Tabelog photographs are imported, visually reviewed and shown without generative alteration or destructive cropping. Customer-uploaded photographs are deliberately excluded.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The bare routes select a saved locale, then the browser language. Direct routes are available at `/en` and `/ja`.

Production verification:

```bash
npm run photos:inventory
npm run photos:import-tabelog
npm run photos:audit
npm run audit:source
npm run check
npm run start
```

`npm run check` runs ESLint, TypeScript, Vitest and the production build. Browser coverage is separate:

```bash
npx playwright install chromium
npm run test:e2e
```

## Public content and verified links

The static fallback contains every audited visible reference entry as of 2026-07-17:

- 100 Food records
- 5 Set Menu/Course records
- 74 Drinks records
- 27 Lunch records
- 17 Menu Photo catalogue records

The row-level audit is in `data/source-audit.json`. Japanese names and listed price text are preserved; unsupported ingredients, allergens and dietary claims are not added. The five course destinations are centralized in `data/courses.ts` and locked by unit and browser tests.

## Customer reservation requests

The localized `/en/reservation` and `/ja/reservation` pages collect the customer and party details needed for a reservation request. Valid submissions go to the same-origin `/api/reservations` endpoint, which validates the request again and calls the restricted Supabase `submit_reservation_request` function. Each new row starts as `pending` and receives a human-readable `SKR-YYYYMMDD-XXXXXX` reference. The submission token makes retries idempotent, so a repeated request does not create a second row.

The confirmation URL contains only the human-readable reference. The customer name, date, time and guest count are kept in that browser’s session storage for the confirmation screen; internal database IDs are never returned. The page clearly states that staff approval is required. If Supabase is not configured or unavailable, the form stores nothing and shows the existing telephone and Tabelog fallbacks.

The publishable Supabase key is safe to expose as designed: anonymous users have no direct table read, update or delete policy. The only public database operation is the validated submission function. Never add a Supabase service-role key to a `NEXT_PUBLIC_` variable or browser code.

## Authorized restaurant photography

The inventory contains 169 expected reference slots: 113 food, 10 drinks, 16 interior, 8 exterior, 17 menu photos and 5 course images. The verified Tabelog owner gallery currently supplies 55 unique originals: 37 food, 3 drinks, 14 interior and 1 exterior. Five course slots reuse two of those food photographs. The import excludes 92 customer gallery uploads and all 17 customer-uploaded Menu Photo entries.

The current audit contains 55 included unique originals, 5 excluded duplicate course-slot mappings and 109 reference slots awaiting a future authorized owner original. Review:

- `data/authorized-image-inventory.json`
- `data/authorized-image-inventory.csv`

To reproduce the verified restaurant-owner import, run:

```bash
npm run photos:import-tabelog
npm run photos:audit
```

The import script reads only Tabelog records explicitly marked as owner posts, downloads the original asset, records its source and never copies customer posts. Provenance is stored in `data/tabelog-owner-photo-sources.json`.

For additional authorized originals, place files anywhere inside the repository (for example, the ignored `photo-imports/` folder), then map—do not rename—the supplied files in `data/image-authorization.json`:

```json
{
  "authorizedFiles": [
    {
      "referenceId": "food-001",
      "suppliedPath": "photo-imports/arbitrary-camera-name.jpg",
      "authorizationConfirmed": true,
      "altEn": "Accurate description of the photographed dish",
      "altJa": "写真に写っている料理の正確な説明",
      "featured": true
    }
  ],
  "confirmedNearDuplicateExclusions": [],
  "manualExclusions": [
    { "referenceId": "food-099", "reason": "Human review: unique but corrupted beyond usable presentation" }
  ]
}
```

Then run:

```bash
npm run photos:inventory
npm run photos:audit
```

The audit copies each accepted original byte-for-byte into `public/images/originals/<category>/`; the supplied file is untouched. It decodes with Sharp, records dimensions, SHA-256 and perceptual hash, generates only a tiny blur preview, excludes exact duplicates, and reports possible near-duplicates for visual confirmation. A near-duplicate is excluded only after its lower-quality reference ID is added to `confirmedNearDuplicateExclusions`. Unique tiny, blurry or underexposed images remain included unless a human records a precise reason in `manualExclusions`.

Outputs:

- `data/photo-manifest.json` — authorized, included gallery records
- `data/duplicate-report.json` — exact duplicates and visual-review candidates
- `data/quality-review.json` — decode and quality findings
- updated JSON and CSV inventory

Originals are never generatively changed, restyled or destructively cropped. The UI uses intrinsic dimensions and `object-fit: contain`.

## Supabase owner dashboard and reservations

The public restaurant pages need only `NEXT_PUBLIC_SITE_URL`. Customer reservation submission and owner tools also require the two Supabase variables in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Setup:

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Apply `supabase/migrations/001_initial.sql`, then `supabase/migrations/002_reservations.sql`, in that order through the Supabase SQL editor or CLI.
4. Create the owner through Supabase Auth.
5. Add that Auth user UUID to the allowlist:

```sql
insert into public.admin_users(user_id) values ('AUTH-USER-UUID');
```

The `restaurant-originals` bucket is private. RLS permits draft/upload access only to allowlisted owners and public reads only for published, authorized, non-excluded records. No service-role key is used in browser code. Public pages read each published document independently and use the complete static document whenever Supabase is missing, empty or unavailable.

Dashboard workflow:

1. Sign in at `/admin`.
2. Open `/admin/reservations` from the protected owner header to search, filter and manage customer requests.
3. Confirm, reject or cancel requests; edit date, time or guest count; add private notes; and mark completed or no-show reservations.
4. Use the content studio to edit the bilingual JSON document, save a draft and publish explicitly.
5. Upload authorized originals into inventory slots and publish each accepted photograph explicitly.

Reservation notification events are inserted into `reservation_notification_outbox` for owner-new-request, customer-received, confirmed, rejected and cancelled events. `lib/notifications/reservation-notifications.ts` provides the delivery interface, but the included implementation is deliberately unconfigured and reports `sent: false`. No email is claimed as sent until a real provider and outbox worker are added.

## Project structure

- `app/[locale]/` — localized public routes
- `app/admin/` — protected content and reservation dashboards with server actions
- `components/` — public and admin UI
- `data/` — audited static content, inventories and photo reports
- `lib/` — locale, SEO, reservation, content fallback and Supabase utilities
- `scripts/` — source/inventory/photo audit tooling
- `supabase/migrations/` — schema, RLS and publishing function
- `tests/` and `e2e/` — unit, interaction, accessibility and responsive browser coverage

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to the production origin before building. Deploy as a standard Next.js application. Supabase variables are optional for browsing the public site but required to accept reservation requests. After deployment, smoke-test `/en`, `/ja`, `/en/menu`, `/en/reservation`, `/admin`, `/admin/reservations`, `/sitemap.xml` and `/robots.txt`.

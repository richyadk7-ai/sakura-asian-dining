# Sakura Asian Dining & Bar

A production-ready bilingual Next.js website for さくらアジアンダイニング&バー in Takadanobaba. The public site works in full without a backend; Supabase activates the protected owner publishing workflow.

## Launch status

- Phase 1 public website: implemented with `/en` and `/ja` routes, all audited menu records, five exact course links, internal bilingual reservation requests, responsive design, accessibility, SEO, tests and static content fallback.
- Phase 2 owner tools: implemented at `/admin` and `/admin/reservations` with Supabase SSR auth, owner allowlist, RLS, reservation management, drafts, explicit publishing and private authorized-original uploads.
- Restaurant photography: 55 unique authorized restaurant photographs are stored locally, visually reviewed and shown without generative alteration or destructive cropping. Customer-uploaded photographs are deliberately excluded.
- Privacy and monitoring: standalone bilingual policies are published at `/en/privacy` and `/ja/privacy`; anonymous Vercel Web Analytics and Speed Insights measure public-page usage and Core Web Vitals without analytics cookies. Private admin and reservation-confirmation pages are excluded and public query strings are removed before measurement.

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

The confirmation URL contains the human-readable reference and the request's unguessable submission token. Together they provide read-only access to that one reservation through `get_reservation_status`; the API never returns email, phone, allergies, special requests, owner notes or internal IDs. The confirmation screen checks for staff decisions every five seconds while open and refreshes when the customer returns to the tab. If Supabase is not configured or unavailable, the form stores nothing and shows the existing telephone fallback.

The publishable Supabase key is safe to expose as designed: anonymous users have no direct table read, update or delete policy. The only public database operation is the validated submission function. Never add a Supabase service-role key to a `NEXT_PUBLIC_` variable or browser code.

## Authorized restaurant photography

The inventory contains 169 expected reference slots: 113 food, 10 drinks, 16 interior, 8 exterior, 17 menu photos and 5 course images. The project currently includes 55 unique authorized originals: 37 food, 3 drinks, 14 interior and 1 exterior. Five course slots reuse two of those food photographs. Customer uploads and all 17 customer-uploaded Menu Photo entries are excluded.

The current audit contains 55 included unique originals, 5 excluded duplicate course-slot mappings and 109 reference slots awaiting a future authorized owner original. Review:

- `data/authorized-image-inventory.json`
- `data/authorized-image-inventory.csv`

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
3. Apply every SQL file in `supabase/migrations` in numeric order through the Supabase SQL editor or CLI. Migration `004_realtime_reservation_alerts.sql` enables the protected live reservation feed, `005_owner_web_push.sql` adds owner-only device subscriptions for lock-screen alerts, and `006_customer_reservation_status.sql` enables the token-protected customer status screen.
4. With the default Supabase mailer, set the Auth Site URL to `https://YOUR-DOMAIN/admin/set-password`. The password page safely completes the default invitation session before showing the owner form.
5. Add `https://YOUR-DOMAIN/admin/auth/confirm` plus `http://localhost:3000/admin/auth/confirm` to the allowed redirect URLs. If custom SMTP is configured later, its Invite user template can link to `{{ .SiteURL }}/admin/auth/confirm?token_hash={{ .TokenHash }}&type=invite` after changing `.SiteURL` back to the site origin.
6. Send the owner an invitation through Supabase Auth.
7. Add that Auth user UUID to the allowlist:

```sql
insert into public.admin_users(user_id) values ('AUTH-USER-UUID');
```

The owner opens the invitation, chooses a password at `/admin/set-password`, and is then taken to the protected reservations dashboard. Never create or share the owner password on someone else's behalf.

The `restaurant-originals` bucket is private. RLS permits draft/upload access only to allowlisted owners and public reads only for published, authorized, non-excluded records. No service-role key is used in browser code. Public pages read each published document independently and use the complete static document whenever Supabase is missing, empty or unavailable.

Dashboard workflow:

1. Sign in at `/admin`.
2. Open `/admin/reservations` from the protected owner header to search, filter and manage customer requests.
3. Confirm, reject or cancel requests; edit date, time or guest count; add private notes; and mark completed or no-show reservations.
4. Keep the reservations page open and press **Enable loud chime** once per browser session. New requests then refresh the queue, display a popup and play the louder local Sakura chime. The same button becomes **Test loud chime**, so staff can check the iPad speaker volume before service.
5. For lock-screen alerts on iPadOS 16.4 or newer, open the deployed site in Safari, use **Share → Add to Home Screen**, launch Sakura from that new Home Screen icon, sign in, open Reservations and press **Enable lock-screen alerts → Allow**. Lock-screen notification sound and volume are controlled by iPad Settings, its volume buttons, Focus mode and notification settings.
6. Use the content studio to edit the bilingual JSON document, save a draft and publish explicitly.
7. Upload authorized originals into inventory slots and publish each accepted photograph explicitly.

The native iPad app uses the same allowlisted Supabase owner account. Its confirm, reject and cancel actions call Sakura's protected owner API, which verifies the current Supabase access token, updates the reservation and sends the same customer decision email as the web dashboard.

Live owner alerts use the existing authenticated Supabase connection and Row Level Security. The foreground chime is generated locally by the browser, so it requires no email account, sound file or paid calling service. Web Push can alert an installed Home Screen web app while the iPad is locked or the dashboard is in the background. Apple controls the lock-screen notification sound; a website cannot force the custom foreground chime there. The iPad must remain powered on and online—no service can deliver to a fully powered-off device, although the push service may deliver after it reconnects.

Web Push setup requires VAPID keys and a shared server-only dispatch secret:

```bash
npx web-push generate-vapid-keys
openssl rand -hex 32
```

Put the generated public/private VAPID values in `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` and `WEB_PUSH_PRIVATE_KEY`, set `WEB_PUSH_SUBJECT` to a monitored `mailto:` address, and put the random value in `PUSH_DISPATCH_SECRET`. Hash that same random value in Supabase once through the SQL editor:

```sql
insert into private.owner_push_dispatch_config(singleton, secret_hash)
values (true, encode(extensions.digest('THE_SAME_RANDOM_SERVER_SECRET', 'sha256'), 'hex'))
on conflict(singleton) do update set secret_hash = excluded.secret_hash, updated_at = now();
```

Never expose `WEB_PUSH_PRIVATE_KEY` or `PUSH_DISPATCH_SECRET` through a `NEXT_PUBLIC_` variable. Push payloads deliberately include only the reservation reference, date, time and party size; customer contact details remain in the protected dashboard.

### Customer email notifications

The reservation API does not email customers while a request is pending. The first confirmed or denied staff decision sends exactly one plain-text Gmail message containing only `Confirmed` or `Denied`. It includes no links, reservation details or follow-up messages, and later status edits do not send duplicates.

For the simplest free setup, enable Google 2-Step Verification, create a 16-character Google App Password, and add these production environment variables in Vercel:

```text
GMAIL_USER=richyadk7@gmail.com
GMAIL_APP_PASSWORD=the-16-character-app-password
```

Use the app password only—never the Google account password. Redeploy after changing environment variables. `NEXT_PUBLIC_SITE_URL` must be `https://sakuradining.co` in production. Decision emails contain no URL; notification outbox rows remain as an auditable delivery record and prevent a second decision email for the same request.

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

Vercel Web Analytics and Speed Insights are installed in the application code and begin reporting after a production deployment. No extra application environment variables are required. Review traffic under **Vercel → Project → Analytics** and performance under **Vercel → Project → Speed Insights**.

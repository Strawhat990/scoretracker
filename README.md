# MBA Trimester-1 Grade Tracker

Account-less, device-synced grade tracker for your 6 Trimester-1 subjects.
Next.js (App Router) + Tailwind + Supabase.

## What it does

- Loads with the 6 subjects pre-seeded (MBA131–MBA136).
- Per subject: CIA1 (/15), CIA2 Mid Sem (/25), Class Participation (/15),
  CIA3 (/15) → Internal total /70, plus End Sem (/50, auto-scaled to /30).
  Grand total /100, shown with a colour-coded ring and progress bar.
- No login. On first load the browser gets a random device id (stored in
  `localStorage`) which is registered against a fresh Supabase "profile."
  All marks are saved against that profile automatically as you type.
- **Sync device**: on your primary device, open Sync → "This is my primary
  device" → generate a 6-digit code. On a second device, open Sync →
  "I have a code" → enter it. That device is now re-pointed at the same
  profile, so both devices show the same marks. Codes expire after 10
  minutes and can only be used once.

## Setup

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run everything in `supabase/schema.sql`. This
   creates the tables, seeds the 6 subjects, enables RLS, and creates the
   two RPC functions used for syncing (`create_sync_code`,
   `redeem_sync_code`).
3. From Project Settings → API, copy the **Project URL** and **anon public
   key**.

### 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run it

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### 4. Deploy

Push to a git repo and deploy on Vercel (or any Next.js host). Add the two
`NEXT_PUBLIC_*` env vars in the host's project settings — same values as
`.env.local`.

## Design

Dark glassmorphism: frosted, blurred card surfaces over an ambient
gradient background, with a glowing coloured edge per subject. Each
subject keeps one consistent accent colour everywhere it appears — the
progress ring, card border glow on hover/open, input focus rings, and
the grand-total bar — defined in `lib/subjectColors.ts`. Edit that file
to change the palette or add colours for future trimesters' subjects.

## Notes on the auth model

There's no real user auth — `device_id` (a random UUID in `localStorage`)
is effectively a bearer token. This is intentionally lightweight for a
personal grade tracker, not something to store sensitive data behind:
anyone with the profile_id could, in principle, read/write those rows,
since Supabase's Row Level Security here allows the `anon` role broad
access rather than checking against a real authenticated user. If you
want stronger guarantees later, move the Supabase calls behind Next.js
API routes and validate the device_id server-side, or switch to Supabase
Anonymous Auth (`supabase.auth.signInAnonymously()`) and rewrite the RLS
policies to key off `auth.uid()`.

## Editing the scaling rule or subjects

- Scaling formula lives in one place: `lib/grading.ts` → `scaleEndSem()`.
- Subjects are rows in the `subjects` table, not hardcoded in the
  frontend — edit them directly in Supabase (or extend the SQL seed) if
  a code/name changes or a subject is added for Trimester 2.

## File map

```
app/
  layout.tsx        Root layout, font/meta
  page.tsx           Dashboard: loads device/profile, subjects, marks; autosave
  globals.css         Design tokens, ledger-rule motif, input styling
components/
  SubjectCard.tsx     Expandable per-subject entry card
  ProgressSeal.tsx    Circular "seal" progress ring (signature visual)
  SyncModal.tsx        6-digit generate/redeem UI
lib/
  supabase.ts         Supabase client
  device.ts           Device id, profile creation, sync code create/redeem
  grading.ts           All scoring math (single source of truth)
types/index.ts        Subject & Marks types
supabase/schema.sql    Full DB schema, RLS policies, RPC functions
```

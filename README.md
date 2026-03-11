# Superstat

Superstat is a multi-tenant basketball analytics app built with Next.js + Supabase. It enables clubs to:

- select a club context (cookie-based)
- upload and review videos
- tag timestamped events to players
- manage event taxonomy
- track player insights and tags
- schedule training sessions and attendance
- view club-level dashboard analytics

The app uses Supabase Row Level Security (RLS) with a custom `x-club-id` request header to isolate club data.

## Superstat Role Assessment Context

This repository is prepared as a technical assessment submission for a role at Superstat.

Assessment intent:

- demonstrate end-to-end product thinking for coaching analytics workflows
- implement secure multi-tenant data isolation with Supabase RLS
- deliver production-minded DX through strict typing, formatting, hooks, and build validation
- provide a maintainable feature-first codebase with clear architecture and documentation

## Table Of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Install And Run](#install-and-run)
- [Seed Synthetic Data](#seed-synthetic-data)
- [Route Map](#route-map)
- [Data Model](#data-model)
- [Security Model](#security-model)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Deployment Notes](#deployment-notes)

## Features

### Club-scoped workspace

- Login-like entry by selecting a club on `/`
- Club selection is stored in the `selected_club_id` cookie
- Protected routes redirect to `/` if club context is missing

### Video workflow

- Upload videos to Supabase Storage bucket `videos`
- Persist video metadata in `videos` table
- Open video review page and tag events by timestamp
- Timeline supports seek-to-time interaction

### Event tagging and taxonomy

- CRUD event types per club
- Create event records with `video_id`, `player_id`, `event_type_id`, and `timestamp_seconds`

### Player management and analytics

- CRUD players with position, dominant hand, jersey number, and primary skill
- Per-player analytics (distribution, trends, team comparison)
- Player tags and quick tag creation

### Training operations

- CRUD training sessions
- CRUD attendance per session and player
- Attendance summary in player profile

### Dashboard

- Video/player/event type counts
- total events, last 7 days activity
- top event types and top players
- recent videos list

## Tech Stack

- Next.js 16 (App Router, React Server Components + Client Components)
- React 19 + TypeScript (strict)
- Supabase (Postgres + Storage + RLS)
- Tailwind CSS v4 + shadcn/ui + Radix primitives
- Zustand (UI shell state)
- Recharts (charts)
- Sonner (toasts)

## Architecture Overview

1. Club context
   - user selects a club on `/`
   - server action sets `selected_club_id` cookie

2. Request scoping
   - `lib/supabase.ts` creates Supabase client and injects `x-club-id` header from cookie
   - SQL policies in `supabase_updated.sql` read `request.headers` to enforce club scope

3. Route protection
   - `proxy.ts` redirects access to protected routes when cookie is absent
   - sidebar layout also redirects to `/` when no club is selected

4. Data mutations
   - feature-level server actions in `features/*/actions.ts`
   - client components call server actions and optimistically refresh UI

## Project Structure

```text
app/
    layout.tsx                    # Global app shell (theme, toasts)
    actions.ts                    # Global actions (logout)
    (no-sidebar)/                 # Public/login route group
    (sidebar)/                    # Protected app routes

features/
    club-select/                  # Club selection/login experience
    club-profile/                 # Club profile + logo update
    upload/                       # Video upload flow
    video-review/                 # Video player + event tagging
    players/                      # Player CRUD + analytics + tags
    event-types/                  # Event taxonomy management
    training-sessions/            # Session CRUD
    training-attendance/          # Attendance CRUD

lib/
    supabase.ts                   # Typed Supabase client + club header injection
    database.types.ts             # Generated/maintained DB typings
    types.ts                      # App-level aliases for DB row types

scripts/
    seed.mjs                      # Synthetic seed script

supabase_updated.sql            # Schema + indexes + RLS policies + storage policies
proxy.ts                        # Route protection middleware/proxy
```

## Prerequisites

- Node.js 20+ recommended
- npm 10+
- Supabase project (local or hosted)

## Environment Variables

Create `.env.local` in project root.

```bash
# Used by app runtime (lib/supabase.ts)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Used by seed script (scripts/seed.mjs)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional but recommended for seeding large datasets
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Notes:

- The app currently reads `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- The seed script currently reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or service role key).
- For local development convenience, set both URL/key pairs to the same values.

## Supabase Setup

1. Create a Supabase project.
2. In SQL editor, run all SQL from `supabase_updated.sql`.
3. Ensure Storage buckets exist:
   - `videos`
   - `club-logos`
4. For buckets above, use the policies already defined in `supabase_updated.sql`.

What the SQL does:

- creates all required tables
- creates constraints and indexes
- enables RLS on all app tables
- creates policy set that enforces `x-club-id` scoping
- creates storage object policies for `videos` and `club-logos`

## Install And Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Quality checks:

```bash
npm run lint
npm run typecheck
```

## Seed Synthetic Data

Run seed directly:

```bash
node scripts/seed.mjs
```

Clear existing data first, then seed:

```bash
SEED_CLEAR=1 node scripts/seed.mjs
```

Seed behavior summary:

- creates multiple demo clubs
- creates players, videos, event types, events, tags, sessions, attendance, metric logs
- uses `x-club-id` scoped clients so data respects tenancy model

Important script note:

- `package.json` currently has `seed:synthetic` scripts that point to `scripts/seed-synthetic.mjs`.
- This repository currently contains `scripts/seed.mjs`.
- Use direct `node scripts/seed.mjs` commands unless you update package scripts.

## Route Map

Public / no-sidebar:

- `/` club selection page

Protected / sidebar:

- `/dashboard`
- `/club-profile`
- `/players`
- `/players/[id]`
- `/videos`
- `/videos/[id]`
- `/upload`
- `/event-types`
- `/training-sessions`
- `/training-attendance`

## Data Model

Core tables:

- `clubs`
- `videos` (belongs to club)
- `players` (belongs to club)
- `event_types` (belongs to club)
- `events` (belongs to video; optional player + event type)

Classification tables:

- `tags` (club tags)
- `player_tags` (many-to-many between players and tags)

Training tables:

- `training_sessions`
- `training_attendance`

Analytics-support table:

- `player_metric_logs`

## Security Model

Tenancy and access rules are enforced by:

- cookie: `selected_club_id`
- Supabase client global header: `x-club-id`
- RLS policies checking `current_setting('request.headers', true)::json->>'x-club-id'`

This means all reads/writes are club-scoped when queries use the configured client.

## Scripts

From `package.json`:

- `npm run dev` start Next.js dev server (Turbopack)
- `npm run build` production build
- `npm run start` run production server
- `npm run lint` eslint
- `npm run format` prettier for ts/tsx
- `npm run typecheck` TypeScript no-emit check

Commit quality gates (local):

- Husky `pre-commit` runs:
   - `bun run format`
   - `bun run build`
- Husky `commit-msg` runs Commitlint with Conventional Commits rules

Note:

- `seed:synthetic` and `seed:synthetic:clear` currently reference a non-existent `scripts/seed-synthetic.mjs` file.

## Troubleshooting

### Redirected back to `/` unexpectedly

- Ensure `selected_club_id` cookie exists.
- Re-select a club on `/`.

### Supabase env var error at startup

- Confirm `.env.local` has `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Restart dev server after env changes.

### Upload works but DB insert fails

- Verify `videos` bucket exists.
- Verify `videos` table and RLS policies are installed from SQL.
- Ensure selected club exists and cookie is valid.

### RLS permission errors during seed

- Use `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- Or validate the SQL policy setup has been applied completely.

### Images/logo not loading

- `next.config.mjs` allows `*.supabase.co` storage paths only.
- Verify URL comes from Supabase Storage public URL.

## Deployment Notes

- Deploy on Vercel or any Node-compatible host.
- Configure production env vars:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- If running seed in production-like environments, also configure:
  - `SUPABASE_SERVICE_ROLE_KEY`
- Apply `supabase_updated.sql` to target Supabase project before first run.

## License

No license file is currently present in this repository.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

One concrete instance of the above: **`middleware.ts` is deprecated in favor of a `proxy` convention** (see
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`) — `npm run build` prints a warning
about it every time. The repo still uses `src/middleware.ts` for the Supabase auth redirect; migrate it if
you're touching auth routing anyway, but don't do an unrelated drive-by migration just to silence the warning.

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build (also runs the TypeScript check)
npm run start    # run the production build
npm run lint     # eslint
npx tsc --noEmit -p tsconfig.json   # type-check only, faster than a full build
```

There is no test suite/runner configured in this repo. Treat `npm run build` (typecheck + compile) and
`npm run lint` as the correctness gate for any change.

## Required setup (env + database)

The app is unusable without three env vars in `.env.local` (see `.env.local.example`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`,
defaults to `gemini-flash-latest` in `src/lib/gemini.ts`).

`GEMINI_MODEL` pins a model name — Google periodically retires model versions for a given API key
("no longer available to new users" 404), which looks like an app bug but isn't. If chat parsing suddenly
fails, check `.env.local`'s `GEMINI_MODEL` against currently available models before touching the chat code.

`supabase/schema.sql` is the one-time base schema (tables + RLS as of initial setup) — the user has already
run it. Everything since is tracked as numbered files in `supabase/migrations/`. Nothing in the app applies
SQL automatically; the user runs each file manually in the Supabase SQL Editor. See the migration rule below
before writing any SQL.

## Workflow rules

**SQL changes always go in a new file, never an edit to an existing one.** `supabase/schema.sql` is frozen
(base schema, already applied). Every change since lives in `supabase/migrations/NNNN_description.sql`
(zero-padded, incrementing — see `0001_event_attachments.sql`). To make a DB change: create the next-numbered
file with only the new SQL, guard it with `if not exists` / `drop policy if exists` so it's individually
re-runnable, and tell the user to run that one file in the Supabase SQL Editor. Never append to `schema.sql`
or edit a past migration file — the user has likely already run it, and re-running a `create policy` or
non-guarded statement a second time errors ("already exists"). This is exactly the mistake that motivated
the rule, so treat it as a hard constraint, not a style preference.

**Commit and push to `origin` (https://github.com/seacrab808/MY_AGENT.git, branch `main`) after finishing a
unit of work**, without waiting for the user to ask each time. Use a real commit message describing the
change (not a placeholder like "d"). This repo is a personal single-branch project — there's no PR review
step, so treat "finish the feature/fix and verify it builds" as the trigger to commit+push, not "wait for
explicit approval."

**Maintain `HANDOFF.md` at the repo root as a running handoff note for the next agent.** Update it — don't
append a new one — when a meaningful chunk of work completes (roughly: after a batch of related requests, or
whenever the user says to). It should be self-sufficient: a future agent reading only `HANDOFF.md` (not this
conversation) should be able to continue. Structure it as:
- **Tried**: what was attempted this round, in enough detail to not re-derive it from git log
- **Done**: what actually landed and works (be specific — file paths, not just feature names)
- **Failed / blocked**: what didn't work, why, and anything ruled out (so it isn't retried blindly)
- **Next steps**: the concrete next thing to do, in priority order

## Architecture

Next.js App Router + TypeScript + Tailwind v4, single Supabase project for Postgres/Auth/Storage, Google
Gemini for natural-language chat → calendar-event parsing. It's a single-user personal planner (not
multi-tenant in any product sense) gated behind Supabase email auth via `src/middleware.ts`.

**Client state lives in `Dashboard.tsx`, not a global store.** `src/components/Dashboard.tsx` owns
`activeTab`, the visible month's `events`, and `selectedDateKey`, and passes callbacks down. Each of
`WeeklyTab` and `DailyPlannerTab`, however, fetches and owns **its own independent `events`/date state** —
switching sidebar tabs unmounts the previous tab, so e.g. the daily planner's selected date always resets
to today on remount. This is intentional-but-easy-to-forget: don't assume navigating one tab's calendar
affects another's.

**Event visibility cascades month → week → day, not the other way.** `PlannerEvent.visibility` (`"month" |
"week" | "day"`, `src/types/event.ts`) controls which calendar tabs show an event: month-tier events show
everywhere, week-tier show in week+day, day-tier show only in day. `filterEventsForTab` in `src/lib/events.ts`
implements the cascade; `TAB_VISIBLE_TIERS` there is the single place that encodes the rule. When an event
is created manually from a given tab, that tab's tier is used as-is. When Gemini parses one from chat,
`computeVisibility()` derives the tier from message shape: a multi-day range or a time-less event is
`"month"`, an event with an explicit clock time is `"week"` (see the system prompt in
`src/app/api/chat/route.ts` for the exact NL rules, including default-duration logic: 1h for normal events,
2h for `meeting` category, unless an explicit end time is given).

**Multi-day events are one row, not N rows.** `event_date`/`event_end_date` define a range; there's no
per-day expansion in the DB. `eventDateKeys()`/`groupEventsByDate()` in `src/lib/events.ts` expand a ranged
event into every date key it spans for calendar-cell lookups, and `fetchEventsForRange()`'s Supabase query
uses an `.or()` overlap filter (not a plain `event_date BETWEEN`) so a trip starting before the visible
window still shows up. `MonthCalendar.tsx` additionally computes per-week-row bar segments/lanes
(`computeWeekBars`) to render continuous multi-day bars that reset at week boundaries — this is calendar-UI
logic, not something coming back from the DB.

**Category vs. color are separate concerns.** `EventCategory` (`general | dday | exam | meeting`) drives the
default duration and the category badge label/color fallback; `PlannerEvent.color` is an optional
user-picked pastel hex override (`PASTEL_COLOR_PRESETS` in `src/lib/events.ts`) used for calendar
dots/bars/chips. Anywhere text sits on top of one of these custom-colored chips, use the
`--pixel-chip-ink` CSS var (`globals.css`), not `--pixel-ink`/`text-pixel-ink` — `--pixel-ink` intentionally
flips to a light color under `prefers-color-scheme: dark`, which makes it unreadable on a background color
that doesn't itself change with theme.

**`EventForm` is a dual-mode create/edit form**, not two components: pass `dateKey`+`visibility` to create,
or `initialEvent` to edit (calls `updateEvent` instead of `createEvent`). `EventDetailModal` (view/edit
toggle + delete + duplicate + attachments) expects to be conditionally rendered with `key={event.id}` by its
parent so switching between events remounts fresh state, rather than using an effect to reset state on prop
change (avoids the `set-state-in-effect` lint error, see `src/components/calendar/EventDetailModal.tsx`).

**Attachments**: `src/lib/attachments.ts` uploads to the `event-attachments` Storage bucket under
`{user_id}/{event_id}/{uuid}-{filename}` and inserts a matching row in `public.attachments`. Images get a
persisted `width` (resizable inline in `EventDetailModal`); non-image files render as a plain download list.
The bucket is public (unguessable UUID paths, acceptable for a single-user app) — object reads bypass RLS,
writes/deletes are folder-scoped to the authenticated user via Storage policies in
`supabase/migrations/0001_event_attachments.sql`.

**Data-fetch pattern**: no React Query/SWR — plain `useEffect` + `createClient()` (browser Supabase client,
`src/lib/supabase/client.ts`) + `setState`. Server-side reads (initial page load, `/api/chat`) use
`src/lib/supabase/server.ts` instead. Period-scoped data (todos/goals per month/week/quarter/year) key off
string period keys from `src/lib/period.ts` (`monthKey`, `weekKey`, etc.), not foreign keys to a
month/week table — there isn't one.

**Sidebar tabs** are an enum (`TabKey` in `src/lib/tabs.ts`) driving conditional rendering in `Dashboard.tsx`,
not routes — the whole app lives at `/`, so there's no per-tab URL/deep-linking.

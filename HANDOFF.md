# HANDOFF.md

Running handoff note for the next agent. Update this file (don't append a new one) after a meaningful chunk
of work — read this file first, before digging through conversation history or git log.

_Last updated: 2026-07-30_

## Tried

- Diagnosed reported "chat AI keeps failing" (browser console showing `/api/chat` 401 then 502). Root cause
  for the 401: `src/middleware.ts`'s matcher excluded `/api/*`, so an expired Supabase access-token cookie
  was never refreshed before `/api/chat`'s own `supabase.auth.getUser()` check ran — the session looked
  logged-out to that route even though the browser tab was still logged in. Fixed by migrating
  `middleware.ts` → `src/proxy.ts` (the Next.js 16 rename CLAUDE.md already flagged as deferred — did it now
  since this touches auth routing directly) and widening the matcher to include `/api`, while adding an
  early-return in `src/lib/supabase/middleware.ts`'s `updateSession()` so API paths still get the
  refresh-and-persist-cookies side effect but skip the page-only redirect-to-`/login` logic (API routes
  return their own JSON 401 instead). For the 502: confirmed via a standalone script that the Gemini API key
  + `gemini-flash-latest` model both work right now (not a repeat of the earlier retired-model issue from
  the prior handoff entry) — likely a transient failure. Improved `src/app/api/chat/route.ts`'s catch block
  to log the actual error status/message instead of a bare `console.error(err)`, so the next occurrence is
  diagnosable from server logs instead of only showing a generic 502 in the browser.

- Built multi-day ("여행" style) calendar events on the monthly grid: continuous colored bars spanning
  days, user-pickable pastel colors, and a month→week→day visibility cascade so an event registered at one
  granularity auto-shows in finer views but not coarser ones.
- Extended the Gemini chat parser to extract date ranges, explicit end times, and default-duration rules
  (1h normal / 2h `meeting`), and to infer the visibility tier from message shape (range or no-time-given →
  month tier; explicit clock time → week tier).
- Built a full event detail/edit flow: click an event anywhere (monthly day popup, weekly chip, daily list)
  → modal with view/edit toggle, delete (with confirm step), duplicate, and file/photo attachments
  (drag-and-drop upload, resizable inline image preview, plain download list for non-images).
- Fixed daily planner UX: click the date title to open a date-picker instead of only prev/next arrows, hide
  the "오늘로" (today) shortcut when already on today, true-center the header, English uppercase weekday
  labels.
- Fixed a font-legibility bug: pastel-colored chips/bars used the theme-reactive `--pixel-ink` var, which
  flips to a light color in dark mode and became invisible on the (theme-independent) pastel background —
  replaced with a new fixed `--pixel-chip-ink` var everywhere text sits on a custom background color.
- Diagnosed a "AI 호출에 실패했어요" chat failure: not a code bug — Google retired `gemini-2.5-flash` for
  this API key ("no longer available to new users", 404). Fixed by switching the default/env model to
  `gemini-flash-latest`.
- Set up a SQL migration convention (see CLAUDE.md "Workflow rules") after `supabase/schema.sql` had
  accumulated multiple appended `alter table`/`create policy` blocks across turns — re-running the whole
  file a second time would error on already-created policies. Extracted the not-yet-applied attachments
  schema/storage additions out of `schema.sql` into `supabase/migrations/0001_event_attachments.sql`;
  `schema.sql` is now frozen back to exactly what's already been applied.
- Added vocab-card groups (e.g. DAY1/DAY2), independent star (★, "어려운 단어") / triangle (▲, "이제 잘
  아는 단어") marks replacing the old single `is_difficult` flag, group multi-select + mark filter when
  building a quiz, and an Enter-key UX fix so adding a word returns focus to the term field.
- Established this file (`HANDOFF.md`) and the git auto-commit/push convention per explicit user request —
  see `CLAUDE.md` "Workflow rules" for the exact rules going forward.
- Added O/△/X completion-check buttons to the daily planner's "오늘의 일정" event list (right side of each
  row), backed by a new `events.check_status` column.
- Refactored `VocabQuiz.tsx`'s quiz-deck state (originally a snapshot array of `VocabWord` objects synced
  back to the live `words` prop via a `useEffect`, which the linter flagged as a `set-state-in-effect`
  violation) to store only word IDs and derive the displayed deck from the live `words` array via
  `useMemo` — removes the effect entirely and the deck can never go stale.

## Done (verified working)

- `npx tsc --noEmit`, `npx eslint src`, and `npm run build` all pass clean as of this handoff (checked
  after every feature batch, not just once at the end).
- Confirmed via a standalone script that `gemini-flash-latest` correctly parses a Korean range-event
  message ("8월 23일부터 24일까지 제주도 여행이 있어") into `event_date`/`event_end_date`.
- Confirmed the multi-day overlap query (`fetchEventsForRange` in `src/lib/events.ts`) constructs correct
  PostgREST `.or()` filter syntax (checked the literal generated URL, not just reasoning about it).
- Not manually browser-tested end-to-end (no login credentials available in this environment) — type/lint/
  build passing is the extent of verification for all UI flows in this handoff (calendar features, vocab
  groups/marks, and the new O/△/X check buttons).
- Committed and pushed to `origin/main` (https://github.com/seacrab808/MY_AGENT.git) after each batch.
- `npx tsc --noEmit` and `npm run build` pass clean after the proxy.ts migration (build output confirms
  `ƒ Proxy (Middleware)` now covers `/api`, and the deprecation warning about `middleware.ts` is gone).
  Not manually re-tested in a live logged-in browser session — could not reproduce the original 401 locally
  (this environment has no logged-in session to let an access token actually expire), so the fix is reasoned
  from the Supabase/Next.js session-refresh model, not confirmed by watching a real expiry-then-recover.

## Failed / blocked

- **Three migration files have not been run against the live Supabase project yet, in this order:**
  1. `supabase/migrations/0001_event_attachments.sql` (attachment columns + storage bucket — needed for
     photo/file upload)
  2. `supabase/migrations/0002_vocab_groups_marks.sql` (vocab_groups table + group_id/is_starred/
     is_triangled columns — needed for vocab grouping/marking)
  3. `supabase/migrations/0003_event_check_status.sql` (events.check_status column — needed for the new
     O/△/X buttons in the daily planner)

  Until the user runs all three, those features will error at the DB layer. **Check this first** if any of
  attachments, vocab groups, or the O/△/X checks look broken next session.
- Did **not** build a true WYSIWYG rich-text editor with images embedded at the cursor position inside
  free-flowing memo text. Deliberately scoped down to: a drop-zone over the memo area that uploads images
  as separate resizable cards displayed alongside the memo text (not interleaved within it). This satisfies
  the literal ask (drag-drop, resize, visible with the memo, files saved per-day) without adding a
  contenteditable/rich-text dependency. If the user pushes back wanting real inline embedding, that's a
  bigger scope change (needs a content model change, likely a rich-text library) — flag it as a decision
  point, don't just build it.
- Did not unify Monthly/Weekly/Daily's date-navigation state. Each tab still owns independent local date
  state and resets to "today" on remount (switching tabs unmounts the previous one). The daily-planner date
  picker mitigates this (jump straight to any date) but the tabs still don't share a "currently viewed date."
  Not fixed because it wasn't asked for directly — the earlier "event not showing in daily" report turned
  out to be exactly this (user was on today, not on the trip's date range), not a data bug.
- Vocab groups: did not add drag-to-reorder groups or bulk move-word-between-groups. Not asked for; flagging
  only so it isn't assumed done.
- O/△/X checks were only wired into the daily planner's `EventList` (the specific place asked for), via a
  new optional `onSetCheckStatus` prop on the shared `EventList` component. Monthly's `DayPopup` and the
  notification popups (`TodayPopup`/`WeeklyPopup`) don't pass that prop yet, so they don't show the check
  buttons — that's an easy follow-up (just pass the same handler through) if the user wants it everywhere,
  but wasn't asked for this round.

## Next steps (priority order)

1. **Confirm the chat 401 is actually gone**: use the app normally, leave the tab open past an hour (Supabase
   default access-token TTL), then send a chat message — should no longer 401. If it still does, the refresh
   token itself may be invalid/revoked (e.g. reuse-detection from multiple tabs) rather than the matcher gap
   that was just fixed; that would need re-logging-in to confirm, not another code change.
2. **User needs to run all pending migration files** in the Supabase SQL Editor, in numeric order.
3. Manually verify in a real browser once logged in: multi-day bar rendering across a month boundary, color
   picker, event edit/delete/duplicate, attachment upload/resize, vocab group create/rename/delete +
   star/triangle quiz filtering, and the new O/△/X buttons in the daily planner — none of this has had human
   eyes on it yet, only automated build/lint checks.
4. If the user wants true inline (cursor-position) image embedding in memos instead of the current
   below-text resizable-card gallery, that's a scope decision to raise with them before implementing — see
   "Failed / blocked" above.
5. If the user wants O/△/X checks in Monthly's day popup or the notification popups too, wire the same
   `onSetCheckStatus` handler pattern used in `DailyPlannerTab.tsx` into those call sites.

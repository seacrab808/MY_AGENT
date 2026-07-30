# HANDOFF.md

Running handoff note for the next agent. Update this file (don't append a new one) after a meaningful chunk
of work — read this file first, before digging through conversation history or git log.

_Last updated: 2026-07-30_

## Tried

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

## Done (verified working)

- `npx tsc --noEmit`, `npx eslint src`, and `npm run build` all pass clean as of this handoff (checked
  after every feature batch, not just once at the end).
- Confirmed via a standalone script that `gemini-flash-latest` correctly parses a Korean range-event
  message ("8월 23일부터 24일까지 제주도 여행이 있어") into `event_date`/`event_end_date`.
- Confirmed the multi-day overlap query (`fetchEventsForRange` in `src/lib/events.ts`) constructs correct
  PostgREST `.or()` filter syntax (checked the literal generated URL, not just reasoning about it).
- Not manually browser-tested end-to-end (no login credentials available in this environment) — type/lint/
  build passing is the extent of verification for the UI flows in this handoff (calendar features AND the
  new vocab groups/marks feature).
- Committed and pushed to `origin/main` (https://github.com/seacrab808/MY_AGENT.git).

## Failed / blocked

- **Two migration files have not been run against the live Supabase project yet:**
  `supabase/migrations/0001_event_attachments.sql` (attachment columns + storage bucket — needed for
  photo/file upload to work) and `supabase/migrations/0002_vocab_groups_marks.sql` (vocab_groups table +
  group_id/is_starred/is_triangled columns on vocab_words — needed for the new grouping/marking feature).
  Until the user runs both, those two features will error at the DB layer. **Check this first** if either
  area looks broken next session.
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

## Next steps (priority order)

1. **User needs to run both pending migration files** in the Supabase SQL Editor, in order:
   `supabase/migrations/0001_event_attachments.sql` then `0002_vocab_groups_marks.sql`.
2. Manually verify in a real browser once logged in: multi-day bar rendering across a month boundary, color
   picker, event edit/delete/duplicate, attachment upload/resize, and the new vocab group create/rename/
   delete + star/triangle quiz filtering — none of this has had human eyes on it yet, only automated
   build/lint checks.
3. If the user wants true inline (cursor-position) image embedding in memos instead of the current
   below-text resizable-card gallery, that's a scope decision to raise with them before implementing — see
   "Failed / blocked" above.
4. Nothing else currently queued.

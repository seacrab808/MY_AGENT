# HANDOFF.md

Running handoff note for the next agent. Update this file (don't append a new one) after a meaningful chunk
of work — read this file first, before digging through conversation history or git log.

_Last updated: 2026-08-03_

## Tried

- **Paper-reading tab: turned "배경 지식" into a repeatable 용어→개념 (term→concept) list, added a 16th
  "배울 점, 깨달은 점" field, and grouped the 16 questions into 5 labeled sections** — follow-up to the
  15-question paper tab from earlier the same day (below), per explicit user request to make the
  background-knowledge field additive (one term at a time) rather than one free-text block, plus a slot for
  takeaways, plus "whatever design/format improves reading efficiency."
  - **`src/types/paper.ts`**: new `TermConceptEntry { term, concept }`; `PaperNoteFields.background` changed
    from `string` to `TermConceptEntry[]`; added `lessons_learned: string` (field #16).
  - **`src/lib/paperNotes.ts`**: `PaperNoteFieldDef` gained optional `section` (a heading string shown above
    the first field of a new group — used to render 5 section headers: ① 이해하기 [1-3] → ② 문제 발견 [4-7]
    → ③ 아이디어와 제안 [8-11] → ④ 검증 [12-13] → ⑤ 총평 [14-16]) and `type?: "text" | "terms"` (only
    `background` is `"terms"`). `emptyPaperNotes()`/`normalizePaperNotes()` now branch on `field.type`:
    `"terms"` fields get `[]`/an array-normalizing path, everything else keeps the old string coercion.
    **Old string-shaped `background` data from papers created before this change is migrated on load** —
    `normalizeTermConceptList()` wraps a leftover string into a single `{ term: "", concept: <old string> }`
    entry instead of dropping it, so nothing existing is lost. No SQL migration needed for any of this
    (`notes` is a jsonb blob, shape lives entirely in app code).
  - **`src/components/paper/PaperNoteForm.tsx`**: renders `field.section` as a small heading (dashed
    top-border) before the relevant field, both in the edit form and the print/PDF view. The `background`
    field gets bespoke UI instead of a shared textarea: a list of term-input + concept-textarea rows (add/
    remove per row via `addBackgroundEntry`/`updateBackgroundEntry`/`removeBackgroundEntry`), rendered as a
    bullet list of "**term** → concept" in the print view. `updateField`'s `key` param is now
    `Exclude<keyof PaperNoteFields, "background">` (background can't go through the generic string setter);
    the two call sites that read/write `notes[field.key]` inside the non-background branch cast to that same
    `Exclude<...>` type since TS narrowing from the `field.key === "background"` ternary check doesn't survive
    into the nested `onChange` closure (a known TS limitation for property-access narrowing across closures,
    not fixable by restructuring without a cast or an early-return).
  - **`src/components/tabs/PapersTab.tsx`**: subtitle text updated "15개 질문" → "16개 질문" (and mentions
    "그래서 뭘 배웠는지").
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (adding/
    removing term↔concept rows, confirming an existing paper's old plain-text background migrates into one
    row instead of erroring or disappearing, the 5 section headers reading sensibly in both the edit form and
    the print/PDF export view) — build/lint-checked only, no login creds in this environment.

- **New "논문 리딩" (paper reading) tab** — user is done drilling vocab for now and wants to read/organize
  papers instead, structured around a fixed 15-question template (아이디어: 정곡을 찌르는 문제 + 왜 지금까지
  못 봤는지 + 왜 재밌는지, per the tables the user typed out verbatim):
  - **New `papers` table** (`supabase/migrations/0011_papers.sql`): `id`/`user_id`/`title`/`url`/`notes
    jsonb`/`created_at`/`updated_at`, owner-only RLS, same pattern as every other per-user table in this app.
    `notes` is a single `jsonb` blob (not 15 separate columns) keyed by the field names in
    `src/lib/paperNotes.ts`'s `PAPER_NOTE_FIELDS` — chosen since these 15 fields are pure user text with no
    query/filter need on individual fields, and a single jsonb column is one migration instead of fifteen
    columns to add/rename if the template ever changes.
  - **`src/types/paper.ts`** (`Paper`, `PaperNoteFields`) + **`src/lib/paperNotes.ts`**: `PAPER_NOTE_FIELDS`
    is the user's 15-row table (# / 항목 / 핵심 질문) transcribed as data, not hardcoded per-field JSX, so the
    form/print-view/etc. all just `.map()` over it — adding/reordering/rewording a question later is a
    one-line change in this one array, not a hunt through JSX. `normalizePaperNotes()` defensively coerces
    whatever comes back from the `jsonb` column (which Postgres/PostgREST gives zero compile-time guarantees
    about) into always having all 15 keys as strings, so an older/partially-filled row never crashes a
    `.value` access on `undefined`.
  - **No file/image upload** — deliberately, per the explicit "사진이나 문서 업로드는 안 하려고." Each paper
    is just a `title` + an optional `url` (any link, typically an arXiv/OpenReview/etc. PDF URL), rendered as
    a plain `<a target="_blank" rel="noopener noreferrer">` — clicking it opens the PDF in a new tab exactly
    as asked, no download/storage/bucket involved at all.
  - **New components**: `src/components/paper/PaperList.tsx` (add-paper mini-form + a selectable list, each
    row has a small "↗" open-in-new-tab link when a `url` is set, plus an X-with-confirm delete — same
    immediate-delete-with-confirm-step UX as `TodoList`/`GoalList`) and
    `src/components/paper/PaperNoteForm.tsx` (title/url fields + all 15 fields as labeled
    `label`/`question`/`textarea` blocks, one shared "저장" button for the whole note — same
    single-button-saves-everything pattern as `DiaryBox`/`MonthlyRetrospective`, not 15 separate autosaves).
    `src/components/tabs/PapersTab.tsx` wires them together (fetch/add/save/delete against `papers`,
    `newest-first` order) and is a 2-column `lg:grid-cols-[300px_1fr]` layout (list | detail), collapsing to
    stacked on mobile. **Learned from the diary/retrospective silent-failure bug earlier this session**:
    `PaperNoteForm`'s save button surfaces `error.message` in red next to it on failure, from the start,
    rather than needing a follow-up bug report to add that later.
  - **PDF export is `window.print()` + a dedicated print-only view, not a JS PDF-generation library.**
    This was a deliberate trade-off, flagged here in case the user expected a literal one-click file
    download instead: real one-click PDF libraries in the browser are either `jsPDF` (built-in fonts have
    **zero Korean glyph support** — Korean text would render blank/garbled without embedding a Korean font,
    a large added dependency) or `html2canvas`+`jsPDF` (rasterizes the DOM into an image — sidesteps the font
    problem but produces blurry, non-selectable, non-searchable "text", and needs manual page-split logic for
    long content). `window.print()` uses the browser's own text renderer, so Korean (or any language) just
    works with zero extra dependencies, and the browser handles pagination — the one UX cost is that clicking
    "📄 PDF로 내보내기" opens the native print dialog rather than instantly saving a file; the user picks
    "PDF로 저장"/"Save as PDF" as the destination there (1 extra click), which is a widely-used "Export to
    PDF" pattern on the web but is *not* a true single click. Implementation: `PaperNoteForm` renders two
    sibling blocks — the normal editable form (`print:hidden`) and a separate plain-text summary block
    (`hidden print:block`, class `paper-print`) that mirrors the *current* (possibly-unsaved) textarea values,
    so exporting reflects exactly what's on screen, not just the last save. `Sidebar.tsx` gained `print:hidden`
    on its root (a sidebar should never appear in any printed output, not just this tab's), and
    `Dashboard.tsx`'s main-content column gained `print:pl-0` to cancel the `md:pl-[16rem]` space it normally
    reserves for the now-hidden fixed sidebar (otherwise the printed page would have a large blank left
    margin). New `globals.css` rule: `.paper-print`/`.paper-print *` force `color`/`background`/`box-shadow`
    to plain dark-on-transparent inside `@media print`, regardless of light/dark mode — without this, printing
    while in dark mode would produce light-colored (near-invisible) text on the printed page's assumed-white
    background, since dark mode's `--pixel-ink` is intentionally light for on-screen contrast, not print.
  - **New tab wired in**: `"papers"` added to `TabKey`/`TABS` in `src/lib/tabs.ts` (labeled "논문 리딩", 📄),
    positioned right after "단어 카드 퀴즈" and before "채팅창" in the sidebar nav order; `Dashboard.tsx`
    renders `<PapersTab userId={userId} />` when active, same prop pattern as every sibling tab.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (adding a
    paper, editing/saving all 15 fields and seeing the error path if the migration isn't run yet, the
    open-in-new-tab link, and — most importantly — actually clicking "PDF로 내보내기" and confirming the
    print dialog shows a clean one-column layout with no sidebar/app-chrome bleeding through and readable
    text in both light and dark mode) — build/lint-checked only, no login creds in this environment.

- **Fixed the vocab `FlipCard`'s real root cause for "세모 저장이 잘 안되고 있는 것 같아" (and the earlier
  "flipping swaps star/triangle clicks" report) — this time actually confirmed with a live browser test, not
  just reasoning**: the *previous* "fixed" pass on this same card (see the "4 smaller fixes" entry further
  below) only made the ★/▲ buttons visually rotate with the card by duplicating them into both faces — it did
  **not** fix the actual click-routing bug, which is a different, subtler issue:
  - **Root cause, confirmed via an isolated repro + Playwright (`elementFromPoint` at the button's screen
    coordinates, before/after flipping, plus a screenshot)**: `[backface-visibility:hidden]` hides the
    *inactive* face from painting, but — at least in this Chromium build, likely because the ★/▲ buttons have
    their own `z-index: 20` which pulls them into a separate stacking context — it does **not** also exclude
    that face's buttons from hit-testing. So when the card is flipped, what you *see* is the back face's
    correctly-positioned ★/▲ (this part was fine), but what actually **receives the click** is the invisible
    front face's ★/▲ underneath — and since the front face has no counter-rotation of its own (only the back
    face does, specifically to cancel the mirroring for reading direction), its buttons are still sitting
    mirrored left↔right from the flip, so front's ▲ ends up at the on-screen *left* and front's ★ at the
    on-screen *right*. Net effect: clicking the visually-correct "▲" on the back face actually toggles the
    *front face's* `is_starred`, not `is_triangled` — this is exactly the "flip 하면 반대로 클릭된다" symptom,
    and also fully explains "세모 저장이 안 된다": the user clicks ▲ expecting `is_triangled` to flip, but
    `is_starred` silently changes instead (nothing you'd expect to see updates, since the *back* face's own
    background never reflected star/triangle state to begin with — only the front face's gradient does).
  - Repro'd with a standalone HTML file (same 2-face/backface-visibility/z-index structure) driven by
    Playwright: confirmed `elementFromPoint` at the visible ★/▲ position returns the *front* face's buttons
    both immediately after flipping and after flipping back (not the back face's, even though the back face
    is what's painted) — then confirmed adding `pointer-events-none` to whichever face isn't currently active
    (toggled by the same `flipped` boolean already driving the rotation) makes `elementFromPoint` correctly
    return the *visible* face's button in both states. Applied the identical fix to the real
    `FlipCard.tsx`: front face gets `pointer-events-none` when `flipped`, back face gets it when *not*
    `flipped`.
  - Double-checked `VocabQuizTab.tsx`'s `handleToggleStarred`/`handleToggleTriangled` (the actual Supabase
    persistence) — both are structurally identical, symmetric, correct; there was never a separate
    triangle-specific save bug, it was 100% this click-misattribution issue.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. This one *was* verified with a real
    (if isolated, non-logged-in) browser test this time, not just build/lint — see the repro method above.
    Not re-verified inside the actual live app (no login creds in this environment), but the underlying CSS
    mechanism is identical, so this should carry over directly.

- **User reported "이달의 회고랑 오늘의 일기 왜 저장이 안되어있지" — investigated, most likely root cause is
  the still-unrun `0009_diary_mood_and_retrospectives.sql` migration, but the bigger/permanent fix is that
  `DiaryBox.tsx`/`MonthlyRetrospective.tsx` were silently swallowing save/load errors with zero user-visible
  feedback**, so *any* DB-layer failure (missing migration or otherwise) looked identical to "did nothing,
  no explanation" — which is exactly the confusing symptom reported:
  - Both components' `.then(({ data }) => ...)` load callback and `handleSave()`'s `if (!error)` check
    discarded the Postgrest `error` object entirely on failure — no `console.error`, no UI message, nothing.
    A missing `mood` column (diary) or missing `retrospectives` table (retrospective) — exactly what happens
    if `0009_diary_mood_and_retrospectives.sql` hasn't been run yet, which per this file's own "Failed /
    blocked" list below, it hadn't as of the last check — would make every save silently no-op forever, with
    the textarea just looking like it reset/never actually persisted.
  - **Fix**: both components now keep an `errorMsg` state, set from the destructured `error` on *both* the
    load effect and `handleSave()`, and render it in red (`text-pixel-red`) next to the save button/"저장됨"
    timestamp — showing the raw Postgrest error message (e.g. `column "mood" of relation "diary_entries"
    does not exist`, which is exactly what you'd see right now if the migration is still pending) so this is
    self-diagnosing going forward instead of a silent no-op that requires guessing.
  - **This same silent-failure pattern likely also affects `TodoList.tsx`/`GoalList.tsx`/
    `TodayRoutineList.tsx`'s new `completed_at` stamping from the previous entry** (their `toggleDone`/
    `toggle` don't check the update's `error` either) — not fixed in this pass since the user only reported
    diary/retrospective specifically, but flagging since it's the exact same class of bug and would show the
    same "checking doesn't seem to save" symptom once someone notices.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. **Told the user directly: run
    `supabase/migrations/0009_diary_mood_and_retrospectives.sql` if not done yet** — this is the single most
    likely fix for the reported symptom; the error-surfacing change is a diagnostic safety net on top of that,
    not a replacement for actually running the migration. Not manually confirmed against the live DB (no
    credentials in this environment) whether the migration has in fact been run or not.

- **Checked items in TodoList/GoalList/TodayRoutineList now float to the top, ordered by when they were
  checked (earliest-checked = topmost)** — new migration `0010_todo_completed_at.sql` adds a nullable
  `completed_at timestamptz` to `todos`/`goals`/`routines`, since none of the three tables had any timestamp
  of *when* an item was marked done (only the boolean `is_done`), which is required info to order multiple
  checked items relative to each other:
  - New shared `src/lib/checklist.ts` (`sortByCompletion<T>(items, tieBreaker?)`) — done items always sort
    before not-done items, and among done items sorts by `completed_at` ascending; not-done items keep
    whatever order `tieBreaker` gives them (defaults to `created_at` ascending, i.e. unchanged registration
    order). Used by all three call sites so the rule is defined once, not copy-pasted three times.
  - `TodoList.tsx`/`GoalList.tsx`: `toggleDone()` now also stamps `completed_at` (current timestamp when
    checking, `null` again when unchecking — so re-checking later re-enters at a fresh position, not its old
    spot) alongside the existing `is_done` update, and renders `sortByCompletion(todos/goals)` instead of the
    raw fetch order.
  - `TodayRoutineList.tsx`: same `completed_at` stamping on `toggle()`, but passes a custom `tieBreaker` to
    `sortByCompletion` (period rank → `created_at`, i.e. the *same* 오전/오후/저녁 grouping logic it already
    had) — so checked items pool together at the very top regardless of which time-period they came from,
    while still-unchecked items keep their existing 오전→오후→저녁 grouping underneath. This was a deliberate
    design choice (not explicitly spelled out by the user) to reconcile "checked things go to the top" with
    the routine list's existing period-tag structure, rather than either ignoring period grouping entirely or
    skipping this list.
  - **Deliberately did NOT touch `TodayEventList.tsx`'s "오늘의 일정" O/X sort** (`sortDailyEvents()` in
    `src/lib/events.ts`, still unchecked→o→x top-to-bottom) even though it's also "체크하는" in a loose
    sense — that list has its own recently-fixed drag-to-reorder + reschedule-on-X semantics (see the
    previous entry below), and the user's request didn't explicitly call it out; flip it too if asked, but
    don't assume this batch covers it.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (checking
    multiple items in sequence and confirming they stack top-to-bottom in check order, unchecking one and
    confirming it drops back down to the bottom of the not-done group rather than keeping a stale position,
    and the routine list's checked-items-pool-together-across-periods behavior actually reading as intended
    rather than confusing) — build/lint only. **User needs to run
    `supabase/migrations/0010_todo_completed_at.sql`** before this works end-to-end; until then, checking an
    item will error at the DB layer (unknown column `completed_at`).

- **Moved "내 계정" out of the regular sidebar nav list into a new bottom section next to 로그아웃, and
  removed the mascot/greeting decoration** (`Sidebar.tsx`, `Dashboard.tsx`) — user explicitly walked back an
  initial "move Chat too" ask mid-message to "Chat can stay put, only Account should move," so `채팅창`'s nav
  position is untouched:
  - `Sidebar.tsx`: `TABS` (from `lib/tabs.ts`, left unchanged so anything else referencing the full list still
    can) is now split into `NAV_TABS` (everything except `account`, rendered in the normal `<nav>` list same
    as before) and a standalone `ACCOUNT_TAB` lookup. The old dashed-border "마스코트" box (🐰🐻 emoji + random
    cheer-greeting text + 로그아웃 button) was replaced with a new bottom block —
    `border-t-2 border-dashed border-pixel-border` separator + a 내 계정 nav-style button (reusing the exact
    same active/inactive pill styling as the regular nav items, via extracted `navButtonClass()`/
    `navIconClass()` helpers, so it still visually reads as a nav item despite living in a different spot) +
    the unchanged 로그아웃 `PixelButton`. Added `mt-auto` to this block so on desktop (where the sidebar panel
    has a fixed `md:h-[calc(100vh-2rem)]`) it's pinned to the literal bottom edge of the panel, not just
    sitting immediately after the nav with blank space trailing below it as before.
  - **Random cheer-greeting text removed entirely, not just hidden** — since it had no purpose left once the
    mascot box became a plain account/logout control cluster. Removed the `greeting` prop from `Sidebar`'s
    props entirely, and deleted the `cheerTemplate`/`greeting` `useState`/computation and
    `fillCheerTemplate`/`pickRandomCheerTemplate` import from `Dashboard.tsx` (dead code otherwise, since
    nothing else consumed it). Deliberately did **not** delete `src/lib/greetings.ts` itself (the util
    functions) in case this gets reused somewhere else later — just stopped wiring it into the sidebar.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (the new
    bottom block actually pinning to the sidebar's bottom edge on desktop vs. sitting inline on mobile, and
    that 내 계정's active-state highlight still renders correctly when that tab is open) — build/lint only.

- **Fixed the daily-planner drag-to-reorder actually doing nothing, matched the monthly TODO/회고 card
  heights, and swapped the sidebar from `position: sticky` to a real `position: fixed`**:
  - **Root cause of "drag-to-reorder doesn't work" (a real logic bug, not a missing-migration issue)**:
    `DailyPlannerTab.tsx`'s `handleReorder(orderedEvents)` did `setEvents(orderedEvents)` — this updates the
    *array order* in local state, but each individual event object inside that array still carried its *old*
    `sort_order` value (only `TodayEventList.tsx`'s local drag-drop splice reordered the array positions; it
    never touched each event's own `sort_order` field). Since `TodayEventList` re-derives what to render via
    `useMemo(() => sortDailyEvents(events), [events])` on *every* `events` change — and `sortDailyEvents` sorts
    strictly by `check_status` group then by each item's own `sort_order`/`created_at`, ignoring array order
    entirely — the very next render re-sorted by the stale `sort_order` values and snapped the list right back
    to (approximately) its pre-drag order, immediately after the drop. This is why it looked like dragging
    "did nothing" even within the same session, independent of whether `0006_event_sort_order.sql` has been
    run against the live DB yet. **Fix**: `handleReorder` now does
    `orderedEvents.map((e, i) => ({ ...e, sort_order: i }))` before calling `setEvents`, so the in-memory
    `sort_order` matches the just-dropped order exactly — re-sorting reproduces the same order instead of
    reverting. The `reorderEvents(supabase, ids)` persistence call (unchanged) still needs
    `0006_event_sort_order.sql` run for the reorder to *survive a page reload*; this fix only addresses the
    in-session "snaps back immediately" symptom, which is what was reported.
  - **"이달의 TODO"/"이달의 회고" cards now match height by default**: `MonthlyTab.tsx`'s
    `<div className="grid lg:grid-cols-2 gap-4 items-start">` had `items-start`, which makes each grid cell
    size to its *own* content height (`TodoList` vs. a fixed `rows={10}` textarea — different natural
    heights). Removed `items-start` so the grid falls back to its default `align-items: stretch`, making both
    cards stretch to match the *taller* of the two — matches the ask ("높이 맞춰주라... 사용자가 쓰기
    시작하면 높이 달라져도 상관없다"): equal by default, and if one genuinely grows taller than the other
    later, `stretch` still keeps both card *borders* equal height (just with blank space in the shorter one's
    content area) rather than looking mismatched.
  - **Sidebar switched from `md:sticky` to a real `md:fixed`**, per explicit user suggestion. Root cause of why
    sticky wasn't reliably staying put wasn't fully nailed down (never reproduced live in this environment —
    no login creds), but the leading suspect is that `body`/`html` both have `overflow-x: hidden` in
    `globals.css`, which per spec forces the *other* axis's computed `overflow` to `auto` even though it was
    never explicitly set — this can make it ambiguous which ancestor (`html` vs. `body`) is actually the
    "nearest scrolling ancestor" that `position: sticky` anchors against, and sticky is known to behave
    inconsistently when that's unclear. `position: fixed` sidesteps this entirely (always anchors to the
    viewport, full stop, regardless of any ancestor's overflow computation) — which is exactly why the user's
    own suggestion is the more robust fix, not just a simpler one. Implementation: `Sidebar.tsx`'s outer div
    is now `md:fixed md:top-4 md:left-[max(1rem,calc((100vw-80rem)/2+1rem))] md:z-10` (was
    `md:sticky md:top-4 md:self-start`) — the `left` expression re-derives exactly where the sidebar would have
    sat inside `Dashboard.tsx`'s `max-w-7xl mx-auto p-4` centered container (viewport narrower than 80rem+
    padding → flush against the 1rem page padding; wider → centered container's own left margin + 1rem),
    since a truly-fixed element can no longer rely on the normal flex-flow to position it horizontally.
    Because `position: fixed` removes the sidebar from flex flow entirely (unlike `sticky`, which stays "in
    flow" for layout purposes), `Dashboard.tsx`'s main-content column gained `md:pl-[16rem]` (sidebar's
    `w-60`/15rem + the row's old `gap-4`/1rem) to keep reserving the same horizontal space that flex + gap used
    to reserve automatically. Verified `PixelModal`'s overlay is `z-50` (well above the sidebar's new `z-10`),
    so open modals still correctly render on top of the now-fixed sidebar. Mobile (`<md`) is unaffected — all
    the new positioning classes are `md:`-prefixed, same as the sticky version they replaced.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (dragging
    an item and confirming it stays put without a page refresh, the two monthly cards actually rendering
    equal height with little content in each, and the sidebar staying visually pinned to the exact same
    spot while scrolling a long page at both a wide and a ~mobile-breakpoint-adjacent width) — build/lint
    only, no login creds in this environment.

- **Fixed the daily planner's date header not centering (real root cause found, not a CSS tweak),
  restyled the last remaining old-"pixel-game"-style buttons in the vocab tab, and matched 이번 주 목표's
  style to 이번주 TODO's**:
  - **Root cause of the date-header centering bug**: `DailyPlannerTab.tsx`'s date-nav row was
    `<PixelCard className="grid grid-cols-[auto_1fr_auto] items-center gap-2">`. `PixelCard.tsx` deliberately
    applies its `className` prop to *both* the outer frame div and the inner body div (a comment already in
    that file explains this is intentional, so callers elsewhere can reach the actual content container with
    e.g. `flex`/`h-full`) — but that means the outer frame *also* became a 3-column grid here, and since the
    outer frame has only one actual child (the inner body div wrapping everything), that single child just
    collapsed into the grid's first `auto` track instead of spanning/stretching across all three, leaving the
    middle `1fr` track empty and shoving the whole header block against the left edge — exactly the
    "`<` icon hugging the text, big gap after `>`" look in the user's screenshot, not a simple missing
    `justify-center`. Confirmed this theory with an isolated static-HTML repro (side-by-side "bug" vs "fix"
    grid nesting, screenshotted via `npx playwright screenshot`) before touching the real component, since the
    user had already tried (and been frustrated by) surface-level flex/justify-center fixes not working — this
    was never a missing centering class, it was a structural nesting bug. **Fix**: switched to `bodyClassName`
    (a prop `PixelCard` already exposes for exactly this — body-only styling that shouldn't leak to the outer
    frame) instead of `className`, so only the actual body div (containing the real `<`/date-text/`>` children)
    becomes the 3-column grid, which centers correctly. Grepped the rest of the codebase for the same
    `<PixelCard className="...grid...">` pattern — this was the only occurrence, so no other tab has the same
    latent bug.
  - **`VocabWordManager.tsx`'s per-word ★/▲/X action buttons and `FlipCard.tsx`'s ★/▲ corner buttons were
    still on the old pre-redesign pixel-game button style** (`font-pixel` blocky font, hard-edged
    `rounded-[6px]` squares, `active:translate-x/y-[1px]` press effect) — every *other* small action button in
    the app (e.g. `TodoList.tsx`'s/`GoalList.tsx`'s delete button) had already migrated to the soft style
    (`font-cute font-bold`, `rounded-full`, `active:scale-95`) in an earlier redesign pass, these two files were
    just missed. Restyled both to match exactly; also bumped `VocabWordManager`'s word-row radius
    `rounded-[8px]`→`rounded-[10px]` and `FlipCard`'s card-face border `border-[3px]`→`border-2` +
    `--pixel-bevel`→`--pixel-shadow` to match the rest of the app's 2px-border/soft-shadow convention (both were
    still using the pre-redesign thicker border/bevel-shadow tokens).
  - **`WeeklyTab.tsx`'s "이번 주 목표" (`GoalList.tsx`) now matches "이번주 TODO" (`TodoList.tsx`)'s styling** —
    `GoalList` was still using a bare native `<input type="checkbox">` (no themed checkbox at all) and the same
    old pixel-style delete button described above. Swapped the checkbox for `PixelCheckbox` (`tone="purple"`,
    matching the section's existing purple "추가" button accent) and the delete button for the same
    `font-cute`/`rounded-full`/`active:scale-95` treatment as `TodoList`'s, plus matched the list-item radius
    (`rounded-[8px]`→`rounded-[10px]`). Deliberately did **not** add a `ProgressBar` to `GoalList` even though
    `TodoList` has an opt-in one — checked that `WeeklyTab`'s own `<TodoList ... />` call doesn't pass
    `showProgress` either, so "이번주 TODO" itself has no progress bar right now; matching its *actual current
    look* (checkbox/delete-button/radius), not adding a feature it doesn't have. This same `GoalList` is also
    used by `GoalsTab.tsx` (quarter/year goals), which gets this same visual upgrade for free since it's the
    one shared component — not scoped to weekly only, but that's the correct/intended blast radius (same as
    how `TodoList`'s soft-style migration reached every scope automatically).
  - Also gave the weekly calendar's per-day "+" add-event button and event chips a pass — the "+" was a bare
    unstyled text glyph (no border/background at all, inconsistent with every other small icon-button in the
    app), turned into a small round pixel-bordered button matching the rest of the app's icon-button
    treatment; event chip radius bumped `rounded-[6px]`→`rounded-[8px]` to match the slightly-rounder
    convention used elsewhere (e.g. the monthly calendar's own event chips/bars).
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. The date-header centering fix was
    additionally verified with the standalone HTML/CSS repro above (screenshotted, not just reasoned about) —
    everything else in this batch (vocab button restyle, weekly goal-list restyle, weekly +/chip tweaks) was
    build/lint-checked only, not eyeballed in the actual logged-in app (no credentials in this environment).

- **Fixed the background gradient "seam" on scroll, gave light mode its own spring-themed gradient (it had
  none before), and made the twinkling dots look like glowing neon instead of flat dots**, all in
  `globals.css`/`layout.tsx`:
  - **Root cause of the seam**: `:root.dark body`'s gradient (and light mode had no gradient at all, just a
    flat `background-color`) was a plain `background` on `body` with default `background-attachment: scroll`,
    so its `at X% Y%` anchor points are positioned relative to the *whole document* box, not the viewport. On
    any page taller than ~1 screen, most of the radial-gradients (sized 700-900px, anchored near y=0%/y=100%
    of the *full* document) don't reach the vertical middle of a long page at all — scrolling into that
    territory hits the flat fallback color with a visible hard edge where the gradient's falloff radius ends,
    exactly the "뚝뚝 끊기는" cutoff being reported (visible in the user's attached dark-mode screenshot as a
    lighter navy band cutting across the lower part of the page). Fix: added `background-attachment: fixed;`
    to both mode's `body` background — this re-anchors the percentage positions to the *viewport* instead of
    the document, so the exact same gradient is redrawn relative to whatever's currently visible at any scroll
    position, and it can never "run out" no matter how long the page is. (The star/sparkle pseudo-element was
    already `position: fixed`, which is a different, already-viewport-relative mechanism — it didn't have this
    bug, only `body`'s own background did.)
  - **New light-mode background** (`:root:not(.dark) body`): previously light mode had *no* gradient at all
    (just flat `--pixel-bg` cream) — this was likely contributing to the "끊기는" complaint too (an abrupt cream
    wall the moment you're off the mockup's original corner-glow idea, though that was dark-mode-only before).
    Added 4 corner radial-gradients (pink top-left `#ffd3e8`, warm yellow top-right `#fff2ae`, mint-green
    bottom-left `#c8f2cf`, peach bottom-right `#ffdcc2`) plus a soft white glow near center for the "햇살"
    (sunlight) feel, colors picked to match the user's attached cherry-blossom/meadow/rainbow-field reference
    images — same `background-attachment: fixed` treatment.
  - **Stars/sparkles now glow instead of being flat dots, and twinkle out of sync with each other** (previously
    a single `body::after` layer where *every* dot faded in perfect unison via one shared `twinkle` animation,
    which reads as "the whole sky pulsing," not "stars twinkling individually"). Two changes: (1) each dot's
    `radial-gradient` gained a soft halo stop (bright core 0-12% → tinted glow ring fading out by 75%, up from
    a single hard-edged 100%→transparent stop) for a neon-bloom look; (2) split the sparkles into two
    differently-positioned/differently-colored layers — the existing `body::after` (layer A) plus a new plain
    `<div className="sparkle-layer-b" />` added in `layout.tsx` right before the content wrapper (layer B) —
    each with its own animation (`sparkle-a`/`sparkle-b`) and a `1.4-1.7s` delay offset between them, so as one
    layer's dots dim the other's brighten, giving an asynchronous "some sparkling now, others a beat later"
    feel instead of one uniform pulse. Both layers are theme-aware via `:root.dark`/`:root:not(.dark)` on the
    *same* two elements (no 4th element needed) — dark mode uses white/pale-blue/pale-pink "neon star" tints,
    light mode uses white/pale-yellow/pale-peach/pale-mint "sunlight glint" tints, matching the respective
    reference images (night-sky galaxy photos vs. spring floral photos).
  - Verified visually, not just build/lint: used `npx playwright screenshot` (chromium had to be downloaded
    first via `npx playwright install chromium`, not a project dependency, so this was a one-off manual check,
    not something wired into CI) against the running local dev server's `/login` page (no auth needed since
    `body`'s background is global, not gated behind login) in both `--color-scheme=light` and `--color-scheme
    =dark`, confirming the corner-gradient colors, the glowing (not flat) dot appearance, and — via a taller
    `--viewport-size` — that the gradient still fills corner-to-corner with no hard color band at the
    boundary. Did **not** verify the actual left-to-right *twinkle desync timing* visually (a static screenshot
    can't show animation timing; reasoned from the CSS `animation-delay` values instead) or re-check this on
    the real logged-in Dashboard page (only `/login`, which shares the same global `body` background).
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean.

- **Followed the design-mockup zip's *actual code* more literally for the sidebar/calendar** (previous round
  had adapted the mockup loosely; this round the user pushed back — "코드도 줬잖아, 그대로 하면 되잖아" — so
  this pass reads `planner-app.js`'s `renderSidebar()` and `planner-pages.css`'s `.cal-cell`/`.progress-fill`
  directly instead of eyeballing screenshots):
  - **Sidebar is now one single wrapping `div`, not 3 separate floating cards.** Previously `Sidebar.tsx` had
    3 sibling divs each with their own `bg-pixel-panel border-2 rounded shadow` (profile card / nav / mascot
    card), which is exactly what the user was pointing at as wrong ("하나하나 다 떨어져있는게 아니고"). Now
    there's exactly one outer div carrying `bg-pixel-panel border-2 border-pixel-border rounded-[24px]
    shadow-[var(--pixel-shadow)] p-4 flex flex-col gap-3` (this same div is also the `md:sticky` positioning
    element — collapsed into one, not nested), matching the mockup's `renderSidebar()` structure 1:1: a brand
    row (avatar+name+subtitle+theme-toggle) separated from the nav list by a `border-b-2 border-dashed`
    (mirrors `.brand{border-bottom:2px dashed}`), then the nav `<nav>`, then the mascot/greeting box. Since
    nav items no longer need to look like individual floating buttons (they're list rows inside one shared
    panel now), their inactive state dropped its own `bg-pixel-panel border shadow` in favor of
    `border-transparent hover:bg-pixel-bg` (matches `.nav-item{border:1.5px solid transparent}
    .nav-item:hover{background:var(--paper-2)}`) — only the active pill still gets a visible fill/border. The
    mascot box's background changed from matching the outer panel color (which would've made it blend in
    invisibly now that the outer div itself is that color) to a soft `from-pixel-purple/10 to-pixel-pink/10`
    gradient tint, approximating the mockup's `.side-mascot{background:linear-gradient(135deg,lav-50,peach-50)}`
    with this app's own purple/pink accent vars at low opacity (no `-50`-tier lightened tokens exist in this
    codebase's palette, so used alpha instead of adding new tokens). The sticky height switched from
    `md:max-h-[calc(100vh-2rem)]` (shrinks to fit content) to `md:h-[calc(100vh-2rem)]` (mockup's
    `.sidebar{height:calc(100vh-40px)}` is a fixed height, not a cap) — the sidebar panel now visibly extends
    close to the full viewport height with empty space below the mascot box when content is short, same look
    as both `monthly-light.jpg`/`monthly-dark.jpg` reference screenshots, still `overflow-y-auto` as a
    safety fallback if content ever grows past that. The mobile-scroll fade-hint on the nav also switched
    `from-pixel-bg` → `from-pixel-panel` since its backdrop is now the panel color, not the bare page bg.
  - **Progress bar gradient now matches `.progress-fill` exactly**: `--gradient-cheer` in `globals.css` changed
    from a 2-stop purple→pink (`#b79cf0, #f7a8c9`) to the mockup's literal 3-stop
    `linear-gradient(90deg, #a688dd, #f28ba5, #f4a58a)` (lav-500 → coral-500 → peach-500 — reads as
    purple→pink→orange, which is what the user was pointing at in the reference images). This is the single
    shared token every `ProgressBar` usage (오늘의 Routine, 오늘의/이달의 TODO, 오늘의 일정) already reads, so
    no per-component changes needed.
  - **`PixelButton` text size reduced one step** (`text-xl` → `text-base`, kept `font-bold`) — closer to the
    mockup's `.btn{font-size:15px}`. This is the shared primary-action button component used app-wide, so
    the shrink is global by design, matching "버튼들 글씨크기 좀만 줄여줘" (didn't touch call sites that
    already pass their own explicit `text-*` override, e.g. small icon/inline buttons — those were already
    smaller than `text-xl` to begin with).
  - **`MonthCalendar.tsx` day cells now have their own visible background box** (`bg-pixel-bg` added to
    non-today cells — previously fully transparent, showing nothing but the card's own panel color, so
    adjacent days weren't visually distinguishable as separate boxes at rest, unlike the reference screenshots
    where every cell reads as a subtly-shaded rounded rectangle). Cell `border-radius` bumped `10px→14px` and
    the grid gap (weekday header row, day grid, and the multi-day-bar overlay grid — all three kept in sync so
    bars still align with their date columns) `4px→6px`, both matching `.cal-cell`/`.cal-grid` literal values.
    Added a hover shadow (`hover:shadow-[var(--pixel-shadow-sm)]`) alongside the existing hover border/lift,
    matching `.cal-cell:hover`. Also added Sunday/Saturday coloring to both the weekday header labels and the
    day-number text (red for Sun, blue for Sat, skipped on the "today" cell which keeps its own ink color) —
    matches `.cal-dow.sun`/`.cal-dow.sat`/`.cal-num.sun`/`.cal-num.sat`, a literal detail from the CSS that
    had been missed in the earlier looser pass. Deliberately did **not** change the "TODAY" badge (already
    confirmed correct against the reference screenshot in an earlier round — the mockup's own `.cal-badge`/
    `::before` heart CSS is dead code never rendered by its demo JS, the screenshot is ground truth) and did
    **not** port the mockup's bottom `.month-summary` stat-strip (explicitly declined by the user previously).
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (the
    merged single-panel sidebar's spacing/dashed-separator look, the sidebar's new fixed near-full-viewport
    height with trailing empty space, the 3-stop progress gradient rendering smoothly, the smaller button
    text not clipping any fixed-width buttons, and the calendar cells' new visible background boxes + Sun/Sat
    coloring in both light and dark mode) — build/lint-checked only, same as every other batch this session.

- **Made the vocab tab and chat tab fill the screen height (viewport-proportional, not a fixed px cap), and
  gave the chat's assistant messages a Gemini-style gradient avatar**:
  - **Vocab tab (`VocabQuizTab.tsx`)**: both `VocabWordManager.tsx` and `VocabQuiz.tsx` gained an optional
    `className` prop forwarded to their root `PixelCard` (relying on `PixelCard`'s existing behavior of
    applying `className` to *both* the outer frame and the inner body div — see the comment already in
    `PixelCard.tsx` — so a single `flex flex-col` + `min-h-[...]` reaches the actual content container, not
    just the outer border). `VocabQuizTab` passes `className="min-h-[calc(100vh-260px)]"` to whichever of the
    two is showing. Inside `VocabWordManager.tsx`, the word `<ul>` changed from a fixed `max-h-96
    overflow-y-auto` to `flex-1 min-h-0 overflow-y-auto` so it actually grows to fill the now-tall card
    (scrolling internally past that) instead of stopping at 384px regardless of screen size. `VocabQuiz.tsx`'s
    3 states (empty/setup/active-quiz) all take the same `className` on their respective root `PixelCard`, so
    the container visually fills the viewport in every state — the active flip-card grid itself wasn't
    changed (cards keep their fixed `h-36`, per `FlipCard.tsx`; stretching individual card height wasn't
    asked for and would look wrong for a flashcard), just the surrounding card now extends down the page
    instead of stopping short and leaving a large blank gap.
  - **Chat tab**: `ChatTab.tsx` dropped its `max-w-2xl` cap (was clamping width to 672px regardless of screen
    size — now fills the same width as every other full-width tab). `ChatPanel.tsx`'s root `PixelCard`
    switched from an ineffective `h-full` (had no explicit-height ancestor to resolve `100%` against, so it
    was just sized to content) to the same `min-h-[calc(100vh-220px)]` viewport-relative trick, and the
    message-list `div` dropped its `min-h-40 max-h-80` fixed range in favor of `flex-1 min-h-0` so it
    actually grows with the taller card (still scrolls internally once messages overflow it). Message bubbles
    also gained a `lg:max-w-[640px]` cap on top of the existing `max-w-[85%]` so lines don't get uncomfortably
    long now that the container itself is much wider.
  - **New `AssistantAvatar` in `ChatPanel.tsx`**: a small circular badge (blue→purple→pink `linear-gradient`,
    135deg, a ✦ glyph on top) shown next to every assistant message (and the "생각 중..." typing indicator),
    per the explicit "제미나이 디자인처럼" ask — approximates Gemini's spark-icon assistant avatar treatment
    with a plain CSS gradient + glyph (no real logo asset used). Only the assistant side got one — user
    messages are unchanged (still a plain right-aligned bubble, no avatar), matching "상대" (the other party)
    in the request. Assistant message markup changed from a single bubble `div` to a `flex items-start gap-2`
    row wrapping `<AssistantAvatar />` + the bubble (bubble itself no longer carries `self-start`/`max-w-*` —
    those moved to the new wrapper row); user messages are untouched structurally.
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. The `calc(100vh-260px)`/
    `calc(100vh-220px)` offsets are hand-estimated from the surrounding header/toggle-row/page-padding stack
    (same `vh`-based approach the sidebar's own sticky `max-h-[calc(100vh-2rem)]` already uses elsewhere in
    this codebase), not measured against a live rendered page — the exact gap from the very bottom of the
    viewport hasn't been eyeballed in a browser yet, so the offset may need a small tweak if there's noticeably
    too much/too little bottom margin.

- **Applied the Monthly/Daily tabs' "page title" header to every other tab**, and made the daily planner's
  date row use full weekday names:
  - `MonthlyTab.tsx`/`DailyPlannerTab.tsx` already had a standalone (not-in-a-card) header block —
    `<h1 className="font-cute text-3xl font-bold">{제목}</h1>` + `<p className="font-body text-sm
    text-pixel-ink-soft">{emoji} {부제}</p>` — above their content. Per request, ported this exact pattern
    (same classes) to the top of `WeeklyTab.tsx` ("주간 캘린더"), `GoalsTab.tsx` ("분기 · 연도 목표",
    also had to fix indentation/wrap the existing 2-card grid in an outer `flex flex-col gap-4` so the new
    header and the grid are siblings, not the header living inside the grid), `RoutinePresetTab.tsx`
    ("하루 루틴"), `VocabQuizTab.tsx` ("단어 카드 퀴즈"), and `ChatTab.tsx` ("채팅창" — this one's wrapper
    div is the thing `Dashboard.tsx` toggles `hidden` on for the always-mounted-chat trick, so the new header
    hides/shows correctly with the rest of the tab, not independently). `AccountTab.tsx`'s old
    `<PixelCard><h2>👤 내 계정</h2><p>{email}</p></PixelCard>` intro block was replaced with the same
    standalone `h1`/`p` pattern (email now sits in the subtitle line next to a 👤 emoji, dropped the
    surrounding card since none of the other tabs wrap their title in one either). Explicitly **left
    `DailyPlannerTab.tsx` alone** per the request ("오늘의 플래너는 없어도 되고") — it already had this
    header from an earlier round.
  - **Daily planner's date title now shows the full English weekday name** ("THURSDAY" instead of "THU").
    New `ENGLISH_WEEKDAY_FULL` array in `src/lib/date.ts` (parallel to the existing abbreviated
    `ENGLISH_WEEKDAY`, which is still used elsewhere e.g. `TodayEventList`/`WeeklyTab` — deliberately left
    those alone, only swapped the import in `DailyPlannerTab.tsx` itself). The date+weekday text was already
    centered before this change (the header is a 3-column grid — `<`/title/`>` — with equal-width icon
    buttons on both sides, so the middle column, and the `text-center` text inside it, sits centered on the
    whole card regardless of the label's length) — no layout change was needed for the centering ask itself,
    just confirmed it still holds with the now-longer "THURSDAY" text (button is inline-block, so `text-center`
    on its wrapping div was already sufficient; it can still wrap to 2 lines on very narow screens via the
    existing `break-words`, but stays centered either way).
  - `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean. Not manually browser-tested (each
    new header's spacing/emoji choice, and the full weekday name not overflowing/breaking awkwardly on a
    narrow phone width) — build/lint-checked only.

- **GitHub 잔디 grid now stretches to fill the card's full width**, instead of staying a fixed 11px-per-cell
  size and leaving empty space on a wide card. `GithubContributionsCard.tsx`'s week-label row and day-grid
  both switched from a `flex`/`inline-flex` layout with hardcoded `w-[11px] h-[11px]` cells to a CSS `grid`
  with `gridTemplateColumns: repeat(weeks.length, minmax(9px, 1fr))` (set via inline `style` since the column
  count is dynamic/data-dependent, not a fixed Tailwind class) — each week-column grows to fill available
  width via `1fr` down to a 9px floor, and each day cell is `w-full aspect-square` so it stays a square while
  tracking the column's width (this also means cell height, not just width, now grows on a wide screen — the
  whole grid gets visually chunkier/fuller, not just wider with the same tiny squares). `overflow-x-auto` is
  kept on the wrapper as a narrow-screen fallback: once the sum of 9px minimums exceeds the container width,
  the grid overflows and scrolls horizontally instead of squishing cells below a readable size, same
  safety net as before, it just doesn't kick in until much narrower now. `npx tsc --noEmit`, `npm run lint`,
  `npm run build` all pass clean. Not manually browser-tested (exact fill behavior at various card widths,
  and that cells don't get too tall/blocky on a very wide monitor) — build/lint-checked only.

- **4 smaller fixes/additions from the same design-mockup zip, in one batch**: starry dark-mode background,
  a sticky sidebar, a year/month picker on the monthly calendar, and a vocab flip-card bug fix.
  - **Dark-mode "starry night" background**, ported near-verbatim from the mockup's `planner.css`
    (`[data-theme="dark"] body` + `body::after`): `globals.css`'s `:root.dark body` now sets a `background`
    shorthand of 3 stacked navy/purple `radial-gradient`s over a dark base color (`#14113a`), replacing the
    flat `--pixel-bg` solid fill in dark mode only (light mode `body` is untouched — still the plain solid
    `--pixel-bg` color). A new `:root.dark body::after` (`position: fixed`, `z-index: 0`) layers ~11 small
    white/semi-transparent `radial-gradient` dots at fixed % positions for stars, with a 4s `twinkle`
    keyframe animation fading opacity 0.8↔0.4. Because a `position: fixed` pseudo-element painted after the
    real DOM content would otherwise sit on top of it (fixed-positioned elements get their own stacking
    context regardless of z-index value), `layout.tsx`'s `<body>` now wraps `{children}` in a
    `relative z-[1]` div so the actual app content stacks above the star layer — same trick the mockup used
    with its own `.app { position: relative; z-index: 1; }`. `body`'s `transition` changed from
    `background-color` to `background` (shorthand) so the light↔dark toggle still fades instead of snapping,
    at the cost of the gradient positions themselves not being animatable (only opacity/color components
    transition smoothly — acceptable, matches how the mockup did it too, no transition on its own bg swap).
  - **Sidebar now stays fixed in the viewport while the page scrolls** (`Sidebar.tsx`): added
    `md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto` to the sidebar's
    outer wrapper div. Relies on `Dashboard.tsx`'s existing `items-start` on the parent flex row (already
    there, not changed) — `position: sticky` needs the sidebar to not be stretched to the row's full height
    for the sticky offset to have room to move within. Mobile (`<md`, stacked single-column layout) is
    untouched — no sticky behavior there, matches the mockup which only stickied the desktop 2-column grid.
  - **Monthly calendar gained a year/month picker**, mirroring the existing daily-planner date-picker UX
    (click the date title → `PixelModal` opens → pick → auto-closes): new
    `src/components/calendar/MiniMonthYearPicker.tsx` (year row with `<`/`>` `PixelIconButton`s + a 4-column
    grid of the 12 month names) plugged into `MonthCalendar.tsx` via a new `pickingMonth` state + the same
    `PixelModal` component the daily planner already uses for `MiniDatePicker`. Per the explicit request
    ("너무 먼 미래는 말고... 2-3년 뒤까지만"), the year `>` button disables past `currentYear + 3` — the `<`
    (past) direction is deliberately left unbounded since the user only asked to cap the *future*, not the
    past, and historical months should stay reachable.
  - **Fixed vocab quiz `FlipCard.tsx`: the ★/▲ mark buttons now flip with the card.** Root cause: the two
    buttons were siblings *outside* the `[transform-style:preserve-3d]` rotating div, so they were flat
    absolutely-positioned overlays that never actually rotated — they just sat static on top throughout the
    whole flip animation (looked visually detached from the card's 3D motion, not "following" it). Fix:
    duplicated each button (still `stopPropagation`-guarded so clicking a mark doesn't also flip the card)
    into *both* face `div`s (front + back), each inheriting that face's own `[backface-visibility:hidden]`
    and rotation — same trick the back face's meaning-text already relied on (pre-rotated 180deg so its net
    rotation lands back at 0/360deg and reads right-side-up, not mirrored, when flipped). No visual/position
    change when the card is static; the difference only shows during/after the flip.
  - `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean. Not manually browser-tested (the
    starry background's star positions/twinkle timing, the sidebar staying put while scrolling a long page
    on desktop vs. correctly *not* being sticky on mobile, the month-picker's year-cap behavior at the
    boundary, and the flip-card fix actually looking attached mid-animation) — build/lint-checked only.

- **Ported 2 specific visual details from a user-supplied AI design mockup** (a zipped static HTML/CSS/JS
  handoff, not a real design tool file — `planner.css`/`planner-pages.css` were read directly for exact
  values), explicitly *not* the whole mockup — user asked to keep the current structure/composition and
  only borrow these two treatments, and explicitly said no to porting the mockup's bottom "완료한 할 일 /
  이번 달 일정 / 쓴 일기" stat-strip under the monthly calendar:
  - **Monthly calendar's today cell got a "TODAY" corner-tag badge** (`MonthCalendar.tsx`) — a small
    rotated coral pill (`bg-pixel-red`, white text, `rounded-full`) absolutely positioned at
    `-top-1.5 -right-1` so it visually hangs off/overlaps the cell's top-right corner (the "접힌" folded-tag
    look the user pointed at in the mockup screenshot). Had to drop `overflow-hidden` from the today cell
    specifically (kept on all other cells) so the badge isn't clipped. The mockup's own CSS (`.cal-badge`)
    turned out to define exactly this coral/white/pill styling but was actually unused/dead in its demo JS
    (which only ever renders a decorative `♡`, not text) — went with what the *screenshot* showed since
    that's literally what the user referenced, not what the mockup's live demo currently does.
  - **Sidebar's active nav pill got a diagonal 2-stop gradient** (`Sidebar.tsx`) instead of the previous
    single-color-ish vertical fill, plus the icon chip gets a small drop-shadow when active — same idea as
    the mockup's `.nav-item.active` (`linear-gradient(135deg, lav-100, peach-100)`), adapted to this app's
    purple/pink family instead of lav/peach. Also added a dashed border + tiny `✿`/`♡` corner accents to the
    sidebar's bottom mascot/greeting/logout card, matching the mockup's `.side-mascot` treatment.
  - **Both of those are new dark-mode-aware CSS var pairs** (`--today-cell-from/to`,
    `--sidebar-active-from/to` in `globals.css`) rather than the fixed-regardless-of-theme pattern used for
    small chips/category dots — these are large fill areas, so (like `--contrib-0..4`) they need a genuinely
    different, muted value in `:root.dark` or a bright pastel gradient would look wrong sitting on a dark
    panel (confirmed by checking the mockup's own `daily-dark`/`monthly-dark` screenshots, which do show a
    toned-down dark-plum/maroon version, not the bright light-mode pastel). Correspondingly, the text sitting
    on top of these two elements was switched from the fixed `--pixel-chip-ink` to the theme-reactive
    `--pixel-ink` (chip-ink is for text on backgrounds that *don't* change with theme; these two now do).
  - **Sidebar tab order changed** per explicit request: 월간 캘린더 → 주간 캘린더 → 일일 플래너 → 하루
    루틴 → 분기·연도 목표 → 단어 카드 퀴즈 → 채팅창 → 내 계정 (`TABS` array in `src/lib/tabs.ts` — chat
    moved from 2nd to right above account; monthly/weekly/daily reordered; the rest kept their relative
    order). This only reorders the sidebar buttons — `Dashboard.tsx`'s tab-content rendering order (and the
    always-mounted-chat trick) didn't need touching since both just key off `activeTab`, not array order.
  - Daily planner was deliberately left untouched (`"일일 플래너는 지금이 괜찮아서"` — explicitly out of
    scope this round).
  - `npm run build`/`npm run lint` both pass clean. Not manually browser-tested (badge overlap not clipped
    by the surrounding `PixelCard`'s own `overflow-hidden` when today falls in the calendar's first visible
    row, the two gradients' light/dark swap, and the reordered sidebar) — only build/lint-checked.

- **GitHub 잔디 card rebuilt as a self-rendered, theme-aware, rounded-corner grid** — the previous
  `https://ghchart.rshah.org/{username}` `<img>` couldn't be restyled at all (it's a flat external image),
  so it always looked the same in dark mode and its cells were hard squares; the user asked for rounded
  cells and real dark-mode colors, which required owning the rendering:
  - New `src/app/api/github-contributions/route.ts`: a server-side proxy to the public
    `https://github-contributions-api.jogruber.de/v4/{username}?y=last` API (returns `{ total, contributions:
    [{ date, count, level (0-4) }] }` for the trailing ~year, already bucketed into levels the same way
    GitHub buckets its own graph) — chosen over scraping `github.com/users/{u}/contributions`'s HTML because
    that markup changes periodically and scraping is fragile; this JSON API is a known/stable community
    proxy. Proxied through our own route (not called directly from the browser) to sidestep any CORS
    uncertainty and normalize error responses (`404` for a bad username → a Korean error string).
  - `GithubContributionsCard.tsx` rewritten to fetch from that route and render its own grid: `buildWeeks()`
    chunks the day array into Sunday-start 7-row columns (left-padding with empty cells if the API's first
    day isn't a Sunday, rather than assuming it always is), `weekMonthLabel()` labels the one column that
    contains a month's 1st. Each day cell is a `rounded-[3px]` `div` (not a hard square) colored via a new
    inline `style={{ backgroundColor: 'var(--contrib-{level})' }}` — a legend row (적음 → 많음, same 5
    swatches) and an on-hover `title` tooltip (`"2026-07-29 · 26회 커밋"`) were added since a plain `<img>`
    couldn't do either. `data.total.lastYear` is now shown as a "최근 1년간 N회 커밋" line above the grid.
  - New `--contrib-0`..`--contrib-4` CSS vars in `globals.css`, purple-family to match the app's
    `--gradient-cheer` branding (light: pale lavender → deep purple; dark: `:root.dark` override goes dark
    plum → bright pink-purple so filled cells pop against the dark panel) — same "just add a `.dark`
    override, every consumer picks it up for free" pattern as the rest of the theme tokens, so the grid
    auto-recolors when the sidebar's light/dark toggle flips, no JS theme-reading needed in the component.
  - Avoided the same `react-hooks/set-state-in-effect` lint trap hit twice already this session: the
    contributions-fetch effect doesn't call `setState` synchronously in its body at all (not even a
    `setLoading(true)`) — instead there's a `fetchedFor` state that only gets set inside the `.then`/`.catch`
    callbacks, and a derived `loadingData = username !== null && fetchedFor !== username` computed during
    render covers the loading UI.
  - Manually verified the new route against a live `npm run dev` instance (already running on port 3000) —
    `GET /api/github-contributions?username=torvalds` returned real, correctly-shaped JSON
    (`total.lastYear`, 369 daily entries ending today). Not manually verified in an actual browser (grid
    layout/colors/rounded corners/dark-mode swap/tooltip) — only the API leg and `npm run build`/`npm run
    lint` (both clean).

- **User-toggleable light/dark mode from the sidebar**, replacing the old OS-only
  `@media (prefers-color-scheme: dark)` approach:
  - `globals.css`'s dark palette block changed from `@media (prefers-color-scheme: dark) { :root { ... } }`
    to `:root.dark { ... }` — same variable values, just gated on a `.dark` class instead of an OS media
    query, so JS can flip it on demand. Added a `transition` on `body`'s `background-color`/`color` so the
    switch fades instead of snapping.
  - New `src/hooks/useTheme.ts`: reads/writes `localStorage["planner-theme"]` (`"light" | "dark"`) and
    toggles the `dark` class on `document.documentElement`. Initial React state uses a **lazy `useState`
    initializer** that reads the class directly (not a `useEffect` + `setState`, which the
    `react-hooks/set-state-in-effect` lint rule flags) — this only works because `layout.tsx` now also
    injects a small blocking inline `<script>` in `<head>` that runs *before* hydration and adds `.dark`
    to `<html>` based on the stored preference (falling back to `matchMedia('(prefers-color-scheme: dark)')`
    only when nothing is stored yet), so by the time React's initializer runs client-side the class is
    already correct — this is the standard no-flash pattern (same idea as `next-themes`). Because the
    server-rendered HTML can't know the real client theme, `<html>` got `suppressHydrationWarning` and the
    new `ThemeToggle` button also has it (its emoji content depends on this client-only state).
  - New `src/components/ui/ThemeToggle.tsx`: a small circular 🌞/🌙 icon button, wired into the top-right of
    `Sidebar.tsx`'s profile card (next to the name/app-title text). Once a user clicks it, that explicit
    choice always wins over the OS setting from then on (stored in `localStorage`, not re-derived from
    `matchMedia` again).
  - `npm run build`/`npm run lint` both pass clean.

- **Full visual redesign: "pixel game" → soft pastel/washi-tape diary theme**, plus a Daily Planner/Monthly
  restructure, per the user's mockups. Confirmed scope with the user first (full app reskin via shared
  tokens, `HeroBanner` removed and its content moved into a new `Sidebar` profile card, pixel identity fully
  replaced, logout moved to the sidebar):
  - **`globals.css` tokens recolored** to a warm cream/pastel palette (`--pixel-bg`/`--pixel-panel`/
    `--pixel-ink`/`--pixel-border` all retuned; `--pixel-border` now sits close to the panel color so the
    old hard navy outline effectively disappears app-wide with zero per-component edits). `--pixel-shadow*`
    and `--pixel-bevel*` were changed from a flat hard-edge drop-shadow/3D-bevel to soft blurred shadows —
    since `PixelCard`/`PixelButton`/`PixelIconButton`/every "resting vs. active" state across the app
    references these same variable names, this alone flattened the whole UI without touching those call
    sites. Added `--gradient-cheer` (purple→pink) for the new progress bars, and a `.washi-tape` CSS class
    (small rotated colored ribbon) for card corner accents. Removed the dotted-grid `background-image` on
    `body` and the global `image-rendering: pixelated` rule (both were pixel-art-specific).
  - **Shared primitives restyled**: `PixelCard` dropped its 4 corner "rivet" dots and gained an optional
    `tape` prop (renders a `.washi-tape` ribbon in a given tone, used on the daily-planner/monthly cards);
    `PixelButton`/`PixelIconButton` swapped the inset-bevel + translate-on-press effect for a flat fill +
    soft shadow + `scale-[0.97]` press; `PixelCheckbox` changed from a square to a circular checkbox
    (`rounded-full`, new `tone` prop) to match the mockup; `PixelModal` lost its rivets too and its shadow
    now uses the `--pixel-shadow-lg` var instead of a hardcoded flat shadow. New `src/components/ui/
    ProgressBar.tsx` (`{ done, total }` → gradient-filled rounded track + "done/total NN%" caption), reused
    by the routine list, both TODO lists, and today's event list.
  - **Sidebar restructure** (`src/components/Sidebar.tsx`): gained a profile card at the top (avatar emoji +
    `{name}의 플래너` + `PIXEL PLANNER` subtitle) and a mascot/greeting/로그아웃 card at the bottom — the
    `logout` server action now lives inside `Sidebar` itself (imported directly from `@/app/actions`)
    instead of being passed down from `Dashboard`. Nav item pills restyled to the new pastel active/inactive
    states. `Dashboard.tsx` no longer renders `HeroBanner` at all; it still computes the random greeting
    (`pickRandomCheerTemplate`/`fillCheerTemplate`, unchanged logic) but now passes it into `Sidebar` as a
    `greeting` prop instead of a banner subtitle. `HeroBanner.tsx` itself was kept (not deleted) — restyled
    to the new soft theme (font-cute title instead of font-pixel, `border-2`, soft shadow) — since it's still
    used standalone on the logged-out `/login` page.
  - **Daily Planner restructure** (`src/components/tabs/DailyPlannerTab.tsx`): the old 3 separate 오전/오후/
    퇴근 후 `RoutineChecklist` cards were merged into one **`src/components/routine/TodayRoutineList.tsx`**
    ("🔄 오늘의 Routine") that loads all `routines` rows for the date in one query (no `period` filter),
    keeps the same preset-backfill-on-every-visit logic (now running once across all 3 periods instead of
    3x), and renders each item with a small period-tag pill (오전=yellow/오후=blue/저녁=purple) before the
    label; the add-item form gained a period selector (3 toggle buttons) since one form now targets any
    period. `RoutineChecklist.tsx` is now unused and was deleted. `TodoList.tsx` gained an opt-in
    `showProgress` prop (defaults off, so `GoalsTab`'s quarter/year lists are unaffected) that renders a
    `ProgressBar` above the list — turned on for 오늘의 TODO and 이달의 TODO. `DailyPlannerTab` also computes
    a `ProgressBar` for 오늘의 일정 from `check_status === "o"` over `events.filter(!isBarEvent(...))` (bar/
    trip events have no O/X toggle so they're excluded from both sides of the fraction). `DiaryBox.tsx`
    gained a row of 6 mood emoji buttons (😊🙂😐😢😡😴) next to the "📓 오늘의 일기" heading — selecting one
    toggles it (click again to clear) and it's saved together with `content` in the same upsert, in a new
    `diary_entries.mood` column.
  - **New migration `supabase/migrations/0009_diary_mood_and_retrospectives.sql`**: adds
    `diary_entries.mood` (nullable text) and a new `public.retrospectives` table (`user_id`, `period_key`
    = `monthKey()` string, `content`, unique per user+period, owner-only RLS) — backs the new monthly
    retrospective feature below. `src/types/routine.ts` gained `mood: string | null` on `DiaryEntry` and a
    new `Retrospective` type.
  - **New `src/components/routine/MonthlyRetrospective.tsx`**: same load/upsert-on-save pattern as
    `DiaryBox.tsx` but keyed by `monthKey(monthDate)` against `retrospectives` instead of `entry_date`
    against `diary_entries`, no mood picker (not requested for this one).
  - **Monthly tab restructure** (`src/components/tabs/MonthlyTab.tsx`): dropped the old
    `lg:grid-cols-[1.4fr_1fr]` calendar+TODO split — `MonthCalendar` is now full width. Added a category
    color-legend row directly below it (colored dot + label per `CATEGORY_COLOR_HEX`/`categoryLabel` from
    `src/lib/events.ts` — no new categories, just a visual legend for the existing 5). `GithubContribution
    sCard` stays full-width below that (unchanged). Below the GitHub card is a new `lg:grid-cols-2` row:
    left = the redesigned "📝 이달의 TODO" (`TodoList` with `showProgress`), right = the new "📖 이달의 회고"
    via `MonthlyRetrospective`. Also gave `MonthCalendar.tsx`'s "today" cell highlight the new pink/purple
    treatment instead of the old hard-bevel yellow gradient.
  - **Not changed** (explicitly out of scope, confirmed with the user beforehand): `EventCategory` values/
    labels (still `general/travel/important/meeting/conference`, just re-legended visually); the "하루 루틴"
    preset-management tab (`RoutinePresetTab.tsx`) structure — it keeps its 3-column-by-period layout, only
    inheriting the new colors/shadows via shared tokens; `WeeklyTab`/`GoalsTab`/`VocabQuizTab`/`ChatTab`/
    `AccountTab` layouts — all inherit the new palette/primitives automatically with no bespoke edits.
  - Fixed one new lint error introduced by the `TodayRoutineList` merge (`react-hooks/set-state-in-effect`
    from a `setLoading(true)` at the top of the load effect, same class of issue the old, now-deleted
    `RoutineChecklist.tsx` used to have) by dropping that call — the initial `useState(true)` already covers
    first mount, and not resetting to `true` on `dateKey` changes means switching days no longer flashes a
    "불러오는 중..." loading state (arguably better UX, not just a lint workaround).
  - `npm run build` and `npm run lint` both pass clean after this batch.

- Chat persistence + UX, month-calendar dot/bar overlap fix, global button/font tweaks, a real GitHub
  contributions widget, a routine-preset sync bug fix, and a themed date/time picker in `EventForm` — all in
  one session, in request order:
  - **Chat history survives tab switches and reloads.** `ChatPanel.tsx` now persists `messages` to
    `localStorage` (key `planner_chat_history_v1`) with a 24h TTL (`savedAt` timestamp checked on load; stale
    entries are dropped back to the welcome message). Separately, `Dashboard.tsx` now keeps `ChatTab` always
    mounted (hidden via a `hidden` class toggle) instead of conditionally rendering it like every other
    tab — this was the actual fix for "in-flight reply disappears if I switch tabs while it's thinking",
    since the old conditional-render pattern unmounted (and destroyed) the whole component + its pending
    fetch. Other tabs deliberately still unmount on switch (unchanged, matches the existing documented
    per-tab-independent-state behavior).
  - **Month calendar dots no longer overlap multi-day bars.** `MonthCalendar.tsx` previously gave every dot
    row the same fixed `mt-1`, while bars were absolutely positioned starting right below the date number —
    on a day with 1+ bar lanes, the dot row visually collided with the bar(s) on top of it. Now each day
    computes its own overlapping-bar lane count (`bars.filter` on that day's column range) and sets the dot
    row's `marginTop` to clear exactly that many lanes; days with no bar covering them keep the old small
    margin. Also capped visible dots to 3 with a non-wrapping `…` overflow indicator (`flex-nowrap` +
    `overflow-hidden` on the day button) instead of letting extra dots wrap to a second line inside the cell.
  - **`PixelButton` border thinned, text no longer wraps.** `border-[3px]` → `border-2`, added
    `whitespace-nowrap` — fixes 2-character labels like "추가" rendering as two stacked lines when the
    button was narrow.
  - **All body text now uses the cute font.** `globals.css`'s `--font-body` theme var was repointed from
    Noto Sans KR to the same Gaegu font as `--font-cute` — every existing `font-body` usage (descriptions,
    chat bubbles, form helper text) picks this up automatically with no per-component edits. Dropped the
    now-unused `Noto_Sans_KR` font load from `layout.tsx`. Deliberately left `font-pixel` (Press Start 2P)
    alone — still used for small retro badges/X-delete buttons, not "body text".
  - **GitHub contribution graph ("잔디"), now user-connectable, not hardcoded.** First pass hardcoded a
    single username via `NEXT_PUBLIC_GITHUB_USERNAME`/`seacrab808` default; user asked whether it could be
    per-account instead, so it was reworked into a real per-user setting:
    - New `supabase/migrations/0008_user_settings.sql` — `public.user_settings` table
      (`user_id` PK/FK, `github_username`, `updated_at`), owner-only RLS.
    - New `src/types/settings.ts` + `src/lib/settings.ts` (`fetchUserSettings`/`saveGithubUsername`, upsert).
    - New **"내 계정" sidebar tab** (`account` added to `TabKey`/`TABS` in `src/lib/tabs.ts`,
      `src/components/tabs/AccountTab.tsx`) with a form to type/change the GitHub username (accepts a bare
      username, `@username`, or a pasted `github.com/username` URL — normalized before saving; empty +
      save clears it).
    - `src/components/github/GithubContributionsCard.tsx` is now a client component that loads the current
      user's `user_settings.github_username`. If unset, shows a themed "GitHub 연동하기" prompt/button
      (`onConnectClick` prop, wired from `Dashboard` → `MonthlyTab` as `() => setActiveTab("account")`)
      instead of the image. If set, renders `https://ghchart.rshah.org/{username}` — this is a public,
      no-auth SVG image service that mirrors GitHub's own public `/users/{username}/contributions` data
      (verified the actual pixel colors/counts match GitHub's real page for `seacrab808` before wiring it
      up); not a real GitHub OAuth connection, just a per-user stored username. Widened the card from the
      calendar's column to `lg:col-span-2` (full calendar+TODO width) per follow-up request.
  - **Fixed a routine-preset sync bug**: adding a new day-of-week preset (e.g. via chat) only ever showed up
    on daily-planner dates that hadn't been opened yet. `RoutineChecklist.tsx`'s effect used to copy
    `routine_presets` → `routines` rows *only* the first time a date+period had zero rows, so a date already
    materialized before the preset was added never got the new item. Now every load diffs existing routine
    labels against the current day-of-week presets and backfills whatever's missing, on every visit — not
    just the first one. Trade-off (documented in a code comment and to the user): if someone deletes a
    preset-derived item on one specific day only, it can reappear next visit if that preset still exists
    elsewhere (no per-day "skip this one" flag exists).
  - **`EventForm.tsx` date/time fields restyled to match the app** instead of native
    `<input type="date">`/`<input type="time">` (which render as unstyled OS widgets, clashing with the
    pixel/cute theme). New local `DateField` (button + `PixelModal` wrapping the existing `MiniDatePicker`,
    same combo already used by the daily planner's date picker) and `TimeSelect` (hour/minute `<select>`
    pair styled like the other pixel form fields, with an optional "미지정" option so the end-time can still
    be left blank to trigger the existing auto-duration fallback). Explicitly scoped to look close to the
    *current* style per the user's own framing ("나중에 디자인 싹 바꿀 거니까 지금이랑 비슷하게") — not a
    redesign, just swapping the native widgets for themed equivalents.

- Added self-service password change, a display name, and a randomized greeting banner, all in the "내 계정"
  tab / signup flow:
  - **Password change lives in `AccountTab.tsx`'s new `PasswordChangeCard`.** No new DB/API route — it's a
    3-step client-side state machine (`idle` → `verify` → `change`) using only `supabase-js` calls already
    available to a logged-in browser session: "비밀번호 변경하기" reveals a 현재 비밀번호 field; submitting
    that calls `supabase.auth.signInWithPassword({ email, password })` purely as a *verification* check (it
    re-establishes the same session, doesn't log the user out) — a non-`invalid_credentials` error there
    means "그 비밀번호가 안 맞다"; success reveals 새 비밀번호 + 확인 fields, and submitting those calls
    `supabase.auth.updateUser({ password })`. No Supabase migration needed since this only touches
    `auth.users`, not an app table.
  - **Display name is stored in Supabase Auth's `user_metadata.display_name`**, not a new DB column — reused
    the existing `user_settings` pattern's *shape* (small card, load/save, "저장했어요" flash) but skipped a
    migration entirely since `supabase.auth.updateUser({ data: { display_name } })` already persists
    per-user and merges into existing metadata rather than overwriting it. `page.tsx` reads
    `user.user_metadata?.display_name` server-side and passes it into `Dashboard` as `initialDisplayName`;
    `Dashboard` owns it as state (`displayName`/`setDisplayName`) so saving in `AccountTab` (via the new
    `onDisplayNameChange` prop) updates the banner greeting immediately, no refetch/reload needed.
  - **Signup form (`src/app/login/page.tsx`) gained an optional "이름" field**, only rendered in signup mode
    (not login) — `src/app/login/actions.ts`'s `signup()` action reads `formData.get("displayName")` and
    passes it as `options: { data: { display_name } }` to `supabase.auth.signUp()`. Already-registered users
    (signed up before this field existed) just set it later from 내 계정 — same `updateUser` call path as
    everyone else, no backfill/migration needed since a missing key just reads back as `undefined`.
  - **Removed the `{userEmail}` badge next to the 로그아웃 button** in `Dashboard.tsx`'s `HeroBanner` — the
    email is still passed down as a prop (still needed for the password-verify call and shown once inside
    the 내 계정 tab itself), just no longer rendered in the top bar.
  - **New `src/lib/greetings.ts`**: a flat list of ~12 Korean "{name}, 오늘도 ~" cheer templates (2nd person,
    varied emoji/tone) plus `pickRandomCheerTemplate()`/`fillCheerTemplate()`. `Dashboard.tsx` picks one
    template once per mount (`useState(() => pickRandomCheerTemplate())` — deliberately *not* re-rolled on
    every render/rerender, only on remount i.e. "매 켤 때마다" per the request) and interpolates the current
    `displayName` (or `"사용자님"` if unset) into it for the `HeroBanner` subtitle, replacing the old static
    "오늘도 퀘스트를 클리어해볼까요?" text.

## Tried (previous sessions, kept for context)

- Reworked event categories/colors, form styling, and calendar bar appearance per explicit request:
  - **Category set changed and colors are now fixed per category, not user-picked.** `EventCategory` is now
    `general | travel | important | meeting | conference` (was `general | dday | exam | meeting`).
    `CATEGORY_COLOR_HEX` in `src/lib/events.ts` is the single source of truth (하늘색/초록색/빨간색/보라색/
    노란색) and `eventColor()` now ignores `PlannerEvent.color` entirely — it derives purely from category.
    `supabase/migrations/0007_event_category_rename.sql` renames existing rows (`dday`→`important`,
    `exam`→`conference`; `general`/`meeting` unchanged). `PlannerEvent.color` DB column/type field is kept
    but is now dead/unused (avoids a schema migration to drop it; see CLAUDE.md's updated category note).
    `EventForm.tsx`'s color-swatch picker (`PASTEL_COLOR_PRESETS`, now deleted from `src/lib/events.ts`) is
    gone — category buttons themselves now preview/apply the fixed color (selected = filled with that
    category's color, unselected = small color dot + outline). `src/app/api/chat/route.ts`'s Gemini
    `create_event` function's `category` enum/description updated to match.
  - **New `PixelCheckbox.tsx`** (`src/components/ui/`) replaces bare `<input type="checkbox">` in
    `EventForm.tsx`'s 3 checkboxes (multi-day / bar-display / has-time) with a themed custom checkbox
    (`appearance-none` + a `peer`-driven SVG checkmark, pixel-bordered square that fills `pixel-yellow` with
    a check glyph when ticked).
  - **`EventForm.tsx` fonts unified to the cute handwriting font** (`font-cute`, Gaegu) throughout — labels/
    category buttons/textarea/error text now use the class directly; the shared `PixelInput` component
    hardcodes `font-body` internally, so those specific fields (title, date, time inputs) get an inline
    `style={{ fontFamily: "var(--font-cute)" }}` override instead of relying on Tailwind class-order cascade
    (which isn't guaranteed to win). Scoped to `EventForm` only, not a global `PixelInput` change — other
    call sites (login, reschedule modal's date picker) still use the default body font.
  - **Month calendar bars (`MonthCalendar.tsx`) made chunkier, borderless, and slightly translucent**: row
    height 18→24px, row gap 2→3px (both pulled into named constants `BAR_ROW_HEIGHT`/`BAR_ROW_GAP` also used
    for the day-cell `paddingBottom` reservation so they can't drift out of sync), removed the
    `border-y-2`/`border-l-2`/`border-r-2` classes entirely, rounded end-caps bumped 6px→10px, and background
    goes through a new `withAlpha()` helper that appends an 8-digit-hex alpha channel (`d9` ≈ 85%) to the
    category color — deliberately alpha-on-background-only (not a plain CSS `opacity` on the div) so the
    `--pixel-chip-ink` title text stays fully legible instead of fading too.
  - **`PixelButton.tsx` text made bold and one size up** (`text-lg`→`text-xl`, added `font-bold`) — this is
    the shared component used for essentially every labeled action button app-wide (등록/저장/취소/추가/
    수정/삭제/로그인 etc.), so the change is global by design ("전체적으로" in the request). Deliberately
    did **not** touch `PixelIconButton` (the `<`/`>`/date-arrow icon buttons) — it uses the blocky
    `font-pixel` (Press Start 2P) which doesn't have a meaningfully different bold weight and browsers
    synthetic-bolding a pixel font tends to look blurry/broken, so bolding it would likely look worse, not
    better.

- Redesigned the daily planner's "오늘의 일정" list and reworked completion tracking end-to-end:
  - **Removed the 세모(triangle) check state** — `EventCheckStatus` is now `"o" | "x"` only (was
    `"o" | "triangle" | "x"`) in `src/types/event.ts`. `supabase/migrations/0006_event_sort_order.sql`
    nulls out any leftover `'triangle'` rows (defensive; `0003_event_check_status.sql` likely hasn't even
    been run yet per the pending-migrations list below, so this is mostly precautionary).
  - **X is now a "reschedule", not just a completion flag.** Clicking X when unset opens
    `RescheduleModal.tsx` with 4 options (내일/모레/다음 주 월요일/직접 선택, computed from the *viewed*
    `dateKey`, not always today) — picking one marks the original event `check_status: 'x'` (it stays put,
    struck through) **and** inserts a new copy of the event on the chosen date via the new
    `rescheduleEvent()` in `src/lib/events.ts` (single-day only: `event_end_date` forced null, fresh
    `check_status: null`). Clicking X again when already `'x'` just clears it (no popup) — same toggle-off
    pattern as O.
  - **Sorting**: `sortDailyEvents()` in `src/lib/events.ts` sorts unchecked-first, then `o`, then `x` last;
    ties broken by a new `sort_order` int column (nullable, added in the same migration), falling back to
    `created_at`.
  - **Drag-to-reorder**: `TodayEventList.tsx` (new, replaces `EventList` for just this one call site in
    `DailyPlannerTab.tsx`) implements reordering with plain HTML5 `draggable`/`onDragOver`/`onDrop` (no new
    dependency, consistent with the existing attachment drag-drop in `EventDetailModal.tsx`). On drop, the
    whole new order is renumbered 0..n-1 into `sort_order` via a new `reorderEvents()` bulk-update helper.
    Since grouping (unchecked/o/x) is enforced by the sort function regardless of visual drop position,
    dragging an item across a group boundary will "snap back" to its own group after re-sort — accepted
    trade-off rather than building per-column drag zones.
  - **Redesign**: `TodayEventList.tsx` rows are a single flat `div` (not the old button+sibling-buttons
    split) so the drag handle, category chip, title/time, and O/X buttons are all one draggable unit, all
    using `font-body` consistently (previously mixed `font-pixel`/`font-cute`/`font-body` in one row) for a
    cleaner look, with a left accent border in the event's color and a grab-handle glyph (⠿).
  - `EventList.tsx` was simplified back to a plain read-only list (check-button support removed) since
    `DailyPlannerTab` was its only caller with `onSetCheckStatus` — `TodayPopup`/`WeeklyPopup`/`DayPopup`
    never used that prop and are unaffected.
  - Bar-style events (`isBarEvent()` — multi-day or `display_as_bar`) still show with no O/X buttons at all
    in this list, per the existing rule from the previous round.

- User reported the *same* `/api/chat` 401/502 happens on the Vercel deployment even though it works fine
  under `npm run dev` locally. Diagnosis (not yet confirmed against the actual Vercel project — no dashboard
  access from this environment): `.env.local` is git-ignored (correctly), so `GEMINI_API_KEY` /
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` only exist locally unless the user separately
  entered them in Vercel's Project Settings → Environment Variables. Missing/wrong values there would produce
  exactly this pair of symptoms: missing `GEMINI_API_KEY` → `getGeminiClient()` throws → caught in
  `route.ts` → generic 502; missing/wrong Supabase URL/anon key → `auth.getUser()` fails server-side → 401
  even while the browser looks logged in. **User has not yet confirmed or denied this** (question was asked,
  conversation moved on to the routine-chat bug below before getting an answer) — follow up next session.
- Chat only exposed one Gemini function (`create_event`), so a request to add a *recurring* routine (e.g.
  "월~금 오전 루틴으로 스트레칭 추가해줘") got misparsed as a one-off calendar event landing in the daily
  planner's "오늘의 일정" list, instead of populating `routine_presets` (the "하루 루틴" tab +
  `RoutineChecklist`'s 오전/오후/퇴근 후 sections read from `routine_presets` by day-of-week per
  `RoutineChecklist.tsx`'s auto-generate-from-preset effect). Fixed in `src/app/api/chat/route.ts` by adding
  a second function declaration `create_routine_preset` (`label` + `period` + `days_of_week: number[]`,
  0=Sun..6=Sat) and updating the system prompt to route "루틴"/repeating-weekday phrasing there instead of
  `create_event`. On a match, inserts one `routine_presets` row per weekday in `days_of_week`. Verified with
  a standalone script (not just reasoning) that Gemini now picks `create_routine_preset` for "월~금 오전
  루틴..." and "매일 저녁... 루틴..." while still picking `create_event` for a one-off dated request.
  Note: like the existing manual "하루 루틴" tab flow, this only affects *future* preset lookups —
  `RoutineChecklist` only auto-generates from presets when a date/period has zero existing `routines` rows,
  so a day already materialized (e.g. today, if already opened) won't retroactively pick up a preset added
  after the fact. That's pre-existing behavior, not something this change touches.

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

- **Migration files have not been run against the live Supabase project yet, in this order** (check this
  list at the start of every session — it only grows):
  1. `supabase/migrations/0001_event_attachments.sql` (attachment columns + storage bucket — needed for
     photo/file upload)
  2. `supabase/migrations/0002_vocab_groups_marks.sql` (vocab_groups table + group_id/is_starred/
     is_triangled columns — needed for vocab grouping/marking)
  3. `supabase/migrations/0003_event_check_status.sql` (events.check_status column — needed for the O/X
     buttons in the daily planner)
  4. `supabase/migrations/0004_routine_presets.sql` (routine_presets table — from a different session's
     work on "하루 루틴" preset tab, not verified by this session)
  5. `supabase/migrations/0005_event_bar_display.sql` (events.display_as_bar column — single-day events
     shown as a calendar bar like a trip)
  6. `supabase/migrations/0006_event_sort_order.sql` (events.sort_order column + nulls out any leftover
     `'triangle'` check_status — needed for the drag-to-reorder daily list)
  7. `supabase/migrations/0007_event_category_rename.sql` (renames existing `category` values to the new
     5-category set — needed so old events don't end up with a category no longer in `CATEGORY_COLOR_HEX`)
  8. `supabase/migrations/0008_user_settings.sql` (new `user_settings` table — needed for the "내 계정" tab's
     GitHub-username save/load and the GitHub contributions card on the monthly tab; without this, saving on
     the account tab will fail and the contributions card will be stuck showing the "연동하기" prompt)
  9. `supabase/migrations/0009_diary_mood_and_retrospectives.sql` (`diary_entries.mood` column + new
     `retrospectives` table — needed for the mood-emoji picker in 오늘의 일기 and the new "이달의 회고" card
     on the monthly tab; without this, saving a diary mood or a retrospective will error at the DB layer)
  10. `supabase/migrations/0010_todo_completed_at.sql` (`todos`/`goals`/`routines.completed_at` column —
      needed for checked-items-float-to-top-in-check-order ordering in TodoList/GoalList/TodayRoutineList;
      without this, checking a todo/goal/routine item off will error at the DB layer)
  11. `supabase/migrations/0011_papers.sql` (new `papers` table — needed for the new "논문 리딩" tab; without
      this, adding a paper or saving its notes will error at the DB layer)

  Until the user runs all pending ones in order, those features will error at the DB layer (or, for #7
  specifically, old events just silently fall back to the `general` color via `eventColor()`'s `??` —
  not a hard error, but worth running anyway for correct colors). **Check this first** if attachments,
  vocab groups, bar-style events, routine presets, category colors, the O/X checks/reorder, the GitHub
  account tab, or the diary mood/monthly retrospective look broken next session.
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
- O/X checks (and reorder/reschedule) are only in the daily planner's new `TodayEventList` (the specific
  place asked for both times). Monthly's `DayPopup` and the notification popups (`TodayPopup`/
  `WeeklyPopup`) still use the plain read-only `EventList` and don't show check buttons — not asked for,
  flagging so it isn't assumed done.
- Reschedule (X-check) only copies single-day fields — if the original event was itself somehow a bar/
  range event, the new copy is forced single-day (`event_end_date: null`). Not expected to come up since
  bar events don't show O/X buttons at all, but noting the assumption in case that invariant changes.
- Drag-reorder writes `sort_order` as a flat 0..n-1 renumber of *all* currently-loaded day events on every
  drop (simplest correct approach for a small per-day list) rather than a fractional-index insert — fine at
  this scale, would need revisiting if a single day ever has very many events.
- Font unification (`font-cute` everywhere) and the checkbox restyle were scoped to `EventForm.tsx` only
  (the "여기" in the request, right next to the two checkbox labels being described) — not applied to
  `EventDetailModal.tsx`'s view mode, `TodayEventList.tsx`, or other calendar text. Flagging in case the
  user actually meant the whole calendar/event UI and comes back asking why other spots still look mixed.
- `PixelButton` bold/bigger-text change is global (intentional per "전체적으로"), but not manually
  eyeballed in a real browser for any button whose fixed-width/padding might now clip with the larger text
  — only build/lint checked.

## Next steps (priority order)

-8. **User needs to run `supabase/migrations/0011_papers.sql`** before the new "논문 리딩" tab works
   end-to-end (adding/saving a paper will error at the DB layer without it). Not manually browser-tested:
   add a paper with and without a URL, add/remove a few 용어→개념 rows under "배경 지식", fill in a few of
   the other 16 fields (including the new #16 "배울 점, 깨달은 점") and save, confirm the error message
   shows if the migration hasn't been run, confirm the 5 section headers (① 이해하기 ~ ⑤ 총평) render above
   the right fields, click the list row's "↗" and the detail panel's "PDF 열기" link and confirm both open
   the URL in a new tab, delete a paper, and — most importantly — click "📄 PDF로 내보내기" and confirm the
   print-preview dialog shows a clean single-column readout (title + all 16 fields including the
   term→concept bullet list for 배경 지식, no sidebar/other UI, no blank left margin) with dark, readable
   text regardless of whether the app is currently in light or dark mode.
-7. **User needs to run `supabase/migrations/0010_todo_completed_at.sql`** before checking off a todo/goal/
   routine item works end-to-end (checking one will currently error at the DB layer without it). Not manually
   browser-tested: checking several items in sequence stacks them top-to-bottom in check order, unchecking
   drops an item back into the not-done group instead of leaving it stuck at the top, and the routine list's
   checked items pooling together above the 오전/오후/저녁 groups reads sensibly in practice.
-6. Not manually browser-tested (this session's latest batch): drag a daily-planner "오늘의 일정" item and
   confirm it stays in the dropped position (not just during the drag, *after* releasing) — including a page
   refresh afterward to confirm it persisted (needs `0006_event_sort_order.sql` run first, see "Failed /
   blocked" below); the monthly tab's "이달의 TODO"/"이달의 회고" cards rendering equal height at a desktop
   width with little content in each; and the sidebar staying visually pinned in the exact same spot on
   screen while scrolling a long page (both at a wide desktop width and near the `md` breakpoint, confirming
   it correctly reverts to normal in-flow stacking below `md`, not fixed) — the `left` calc in particular
   should be double-checked against the actual rendered position, not just reasoned about algebraically.
-5. Not manually browser-tested (this session's batch): the dark-mode starry background (toggle to dark mode
   and confirm the navy/purple gradient + twinkling stars render, and that page content still sits visibly
   above the fixed star layer, not behind it), the sidebar staying fixed while scrolling a long page on a
   desktop-width window (and confirm it's *not* sticky on a narrow/mobile width, where it should scroll
   normally with the page), the monthly calendar's new year/month picker (click the "yyyy년 M월" title,
   confirm the `>` year arrow disables at `currentYear + 3`, confirm picking a month closes the modal and
   navigates), and the vocab quiz `FlipCard`'s ★/▲ marks visually flipping with the card instead of sitting
   static on top.
-4. Not manually browser-tested: the new "TODAY" corner badge on the monthly calendar (especially when
   today falls in the calendar's very first visible row — make sure it's not clipped by the card's own
   rounded-corner `overflow-hidden`), the sidebar's new diagonal active-tab gradient and dashed mascot-card
   border in both light and dark mode, and the reordered sidebar tabs.
-3. Not manually browser-tested: the rebuilt GitHub 잔디 grid — rounded cell corners actually render, month
   labels line up above the right week column, the legend/tooltip look right, and toggling the sidebar's
   light/dark switch actually recolors the grid (the `--contrib-*` CSS vars) without a page reload. The API
   proxy leg itself (`/api/github-contributions`) was confirmed working against a live dev server.
-2. Not manually browser-tested: the new light/dark toggle — clicking it in the sidebar actually flips the
   whole app's colors, the choice survives a page reload (`localStorage`), and a fresh browser/incognito
   session with no stored preference still respects the OS dark-mode setting on first load. Only
   build/lint-checked so far.
-1. **User needs to run `supabase/migrations/0009_diary_mood_and_retrospectives.sql`** before the new mood
   picker in 오늘의 일기 or the monthly tab's "이달의 회고" card will work end-to-end.
-1b. Not manually browser-tested: the whole redesign batch above — the merged "오늘의 Routine" list
   (backfill still works, period-tag colors, the period selector on add), all 4 new progress bars, the diary
   mood picker persisting/reloading correctly, the monthly retrospective save/reload, the sidebar profile
   card + mascot/logout card on both desktop and a narrow/mobile width, and the restyled login page/
   `HeroBanner`. Only `npm run build`/`npm run lint` were run (both clean) — no human eyes on it in an actual
   browser yet.
0. **User needs to run `supabase/migrations/0008_user_settings.sql`** before the new "내 계정" tab's GitHub
   username save, or the monthly tab's GitHub contributions card, will work end-to-end.
0b. Not manually browser-tested: the account tab's save/load round-trip, the contributions card's
   connected/not-connected states, the reworked `EventForm` date/time pickers (including the nested-modal
   case where `EventForm` is already inside `AddEventModal`/`EventDetailModal`/`DayPopup` and `DateField`
   opens a second `PixelModal` on top — should stack fine since both are simple `fixed inset-0` overlays,
   but hasn't had human eyes on it), and the routine-preset backfill-on-every-visit fix (add a preset, revisit
   an already-opened date, confirm the new item now appears without needing to re-click anything).
0c. Not manually browser-tested: the new password-change flow end-to-end (wrong current password shows the
   error and stays on the verify step; correct current password + matching new passwords actually lets you
   log back in with the new one after signing out), the display-name save updating the banner greeting
   immediately without a refresh, the signup form's optional 이름 field actually landing in
   `user_metadata.display_name` for a brand new account, and that the randomized greeting only re-rolls on a
   fresh page load/tab-mount (not on every keystroke/interaction within the same session).
1. **Ask the user to check Vercel Project Settings → Environment Variables** for `GEMINI_API_KEY`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all three, and note `NEXT_PUBLIC_*` vars need
   a redeploy after being added/changed since they're baked in at build time). This is the leading theory for
   why prod 401/502s but local `npm run dev` works — see "Tried" above — but it's unconfirmed since the user
   hasn't answered yet.
2. **Confirm the chat 401 is actually gone locally too**: use the app normally, leave the tab open past an
   hour (Supabase default access-token TTL), then send a chat message — should no longer 401. If it still
   does, the refresh token itself may be invalid/revoked (e.g. reuse-detection from multiple tabs) rather
   than the matcher gap that was already fixed; that would need re-logging-in to confirm, not another code
   change.
3. **User needs to run all pending migration files** in the Supabase SQL Editor, in numeric order.
4. Manually verify in a real browser once logged in: multi-day bar rendering across a month boundary, color
   picker, event edit/delete/duplicate, attachment upload/resize, vocab group create/rename/delete +
   star/triangle quiz filtering, and the new create_routine_preset chat flow (e.g. "월~금 오전 루틴에 ~
   추가해줘" should show up under "하루 루틴" tab, not as a calendar event) — none of this has had human
   eyes on it yet, only automated build/lint checks + one isolated Gemini function-calling script.
4b. Specifically verify the new daily-planner list once `0006_event_sort_order.sql` is run: O/X toggle,
   X → reschedule modal (내일/모레/다음 주 월요일/직접 선택) actually inserts a new event on the picked
   date, drag-and-drop reorder persists after a page refresh, and unchecked/O/X groups sink in the right
   order.
4c. Once `0007_event_category_rename.sql` is run, verify existing events that were `dday`/`exam` now render
   with the `important`/`conference` colors (red/yellow) instead of falling back to `general` (sky blue),
   and spot-check the new `PixelCheckbox` + category-button styling and the chunkier translucent month-bar
   look in a real browser — this whole styling batch was only build/lint verified, no human eyes on it.
5. If the user wants true inline (cursor-position) image embedding in memos instead of the current
   below-text resizable-card gallery, that's a scope decision to raise with them before implementing — see
   "Failed / blocked" above.
6. If the user wants O/X checks in Monthly's day popup or the notification popups too, port the
   `TodayEventList`/`RescheduleModal` pattern used in `DailyPlannerTab.tsx` into those call sites (they
   currently use the plain read-only `EventList`).

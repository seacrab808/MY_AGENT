# HANDOFF.md

Running handoff note for the next agent. Update this file (don't append a new one) after a meaningful chunk
of work — read this file first, before digging through conversation history or git log.

_Last updated: 2026-07-30_

## Tried

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

-- 픽셀 플래너 MVP 스키마
-- Supabase 대시보드 > SQL Editor 에서 그대로 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_date date not null,
  event_end_date date, -- 여행처럼 여러 날에 걸친 일정의 마지막 날짜. 단일 날짜 일정이면 null.
  event_time time,
  end_time time, -- 명시적 종료 시간(없으면 기본 duration 적용: 일반 1시간 / meeting 2시간)
  description text,
  category text not null default 'general', -- general | dday | exam | meeting ...
  color text, -- 사용자가 고른 파스텔 hex color. null이면 category 기본색 사용
  visibility text not null default 'month', -- month | week | day. 월간/주간/일간 중 어디까지 노출할지(하위 단계엔 항상 노출)
  created_at timestamptz not null default now()
);

-- 기존 테이블에 이미 events가 있는 경우를 위한 안전한 컬럼 추가
alter table public.events add column if not exists event_end_date date;
alter table public.events add column if not exists end_time time;
alter table public.events add column if not exists color text;
alter table public.events add column if not exists visibility text not null default 'month';

create index if not exists events_user_date_idx on public.events (user_id, event_date);
create index if not exists events_user_end_date_idx on public.events (user_id, event_end_date);

alter table public.events enable row level security;

create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);

create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);

create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id);

create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);

-- Phase 2에서 사용할 테이블 (지금 만들어 두되 앱에서는 아직 사용하지 않음)

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  summary_text text,
  created_at timestamptz not null default now()
);

alter table public.attachments enable row level security;

create policy "attachments_owner_all" on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null, -- morning | afternoon | evening
  label text not null,
  routine_date date not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "routines_owner_all" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.diary_entries enable row level security;

create policy "diary_owner_all" on public.diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 사이드바 탭(월간/주간/분기/연도/일일) 공용 TODO
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null, -- month | week | quarter | year | day
  period_key text not null, -- '2026-07' | '2026-W31' | '2026-Q3' | '2026' | '2026-07-29'
  title text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_scope_period_idx on public.todos (user_id, scope, period_key);

alter table public.todos enable row level security;

create policy "todos_owner_all" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 주간/분기/연도 목표
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null, -- week | quarter | year
  period_key text not null,
  title text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_scope_period_idx on public.goals (user_id, scope, period_key);

alter table public.goals enable row level security;

create policy "goals_owner_all" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 단어 카드 퀴즈
create table if not exists public.vocab_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term text not null,
  meaning text not null,
  is_difficult boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists vocab_words_user_idx on public.vocab_words (user_id);

alter table public.vocab_words enable row level security;

create policy "vocab_words_owner_all" on public.vocab_words
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

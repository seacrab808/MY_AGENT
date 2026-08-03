-- 논문 리딩 탭: 논문 링크 + 15개 항목짜리 정리 노트를 저장.
-- notes는 항목이 15개나 되고 앞으로 항목이 조정될 수도 있어서, 컬럼을 15개 두는 대신
-- { summary: "...", background: "...", ... } 형태의 jsonb 하나로 저장 (키 목록은
-- src/lib/paperNotes.ts의 PAPER_NOTE_FIELDS가 기준).
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text,
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists papers_user_created_idx on public.papers (user_id, created_at);

alter table public.papers enable row level security;

drop policy if exists "papers_owner_all" on public.papers;
create policy "papers_owner_all" on public.papers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

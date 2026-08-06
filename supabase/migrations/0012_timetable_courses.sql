-- 시간표 탭: 과목(course) + 요일별 수업 시간(course_sessions).
-- 하나의 과목이 주 여러 회(월/수 등) 수업할 수 있어서 시간은 별도 테이블로 1:N 관계로 둠.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  professor text,
  kind text not null default 'class', -- class(수업) | ta(조교)
  color text not null default '#a3c7ff',
  semester_start date not null,
  semester_end date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_user_idx on public.courses (user_id);

alter table public.courses enable row level security;

drop policy if exists "courses_owner_all" on public.courses;
create policy "courses_owner_all" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null, -- 0=일 1=월 2=화 3=수 4=목 5=금 6=토 (JS Date.getDay() 기준)
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index if not exists course_sessions_course_idx on public.course_sessions (course_id);
create index if not exists course_sessions_user_idx on public.course_sessions (user_id);

alter table public.course_sessions enable row level security;

drop policy if exists "course_sessions_owner_all" on public.course_sessions;
create policy "course_sessions_owner_all" on public.course_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

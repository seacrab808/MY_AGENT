-- 체크(완료) 표시한 순서대로 정렬하기 위해, "언제 완료 처리했는지"를 기록하는 컬럼 추가.
-- is_done만으로는 여러 개를 체크했을 때 어떤 게 먼저 체크됐는지 알 수 없어서 필요.
-- 체크 해제하면 앱 코드에서 completed_at을 다시 null로 되돌림(재체크 시 그 시점이 새 순서가 됨).
alter table public.todos add column if not exists completed_at timestamptz;
alter table public.goals add column if not exists completed_at timestamptz;
alter table public.routines add column if not exists completed_at timestamptz;

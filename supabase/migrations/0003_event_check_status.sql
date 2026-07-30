-- 마이그레이션: 일정 완료 체크(O/세모/X) 표시
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.
-- (schema.sql이나 과거 마이그레이션 파일은 절대 다시 수정하지 마세요.)

alter table public.events add column if not exists check_status text; -- o | triangle | x | null(미체크)

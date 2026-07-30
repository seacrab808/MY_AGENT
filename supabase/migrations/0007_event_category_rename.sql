-- 마이그레이션: 일정 종류(category)를 새 5종 + 종류별 고정 색상 체계로 정리
-- Supabase 대시보드 > SQL Editor 에서 이 파일 하나만 그대로 실행하세요.
-- (schema.sql이나 과거 마이그레이션 파일은 절대 다시 수정하지 마세요.)

-- 기존 카테고리 -> 새 카테고리로 이름만 변경 (재실행해도 안전: 이미 바뀐 행은 다시 안 걸림)
-- general(일반, 하늘색) / meeting(세미나/회의, 보라색)은 이름 유지
-- dday(디데이) -> important(중요 일정, 빨간색)
-- exam(시험) -> conference(학회, 노란색)
-- travel(여행, 초록색)은 새 카테고리라 기존 데이터 매핑 없음
update public.events set category = 'important' where category = 'dday';
update public.events set category = 'conference' where category = 'exam';

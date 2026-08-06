import { SupabaseClient } from "@supabase/supabase-js";
import { eachDayOfInterval, parseISO } from "date-fns";
import { toDateKey } from "@/lib/date";
import type { Course, CourseKind, CourseSession, CourseWithSessions } from "@/types/course";

// 시간표 전용 색상 팔레트. 이벤트 category 색과 달리 과목별로 사용자가 직접 고름.
export const COURSE_COLOR_PALETTE: string[] = [
  "#a3c7ff", // blue
  "#ffb3d1", // pink
  "#ffd873", // yellow
  "#9fe3c1", // mint
  "#c6aeff", // purple
  "#ff9c9c", // red
  "#ffc48a", // orange
  "#8fd6d6", // teal
  "#c9b79c", // brown
  "#b8c2cc", // gray
];

const KIND_LABEL: Record<CourseKind, string> = {
  class: "수업",
  ta: "조교",
};

export function courseKindLabel(kind: CourseKind): string {
  return KIND_LABEL[kind] ?? "수업";
}

// 월~토만 씀 (일요일 컬럼 없음)
export const COURSE_WEEKDAY_INDEXES = [1, 2, 3, 4, 5, 6];

export async function fetchCoursesWithSessions(
  supabase: SupabaseClient,
  userId: string,
): Promise<CourseWithSessions[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, course_sessions(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return (data as (Course & { course_sessions: CourseSession[] })[]).map((row) => ({
    ...row,
    sessions: [...row.course_sessions].sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));
}

export interface CourseSessionInput {
  day_of_week: number;
  start_time: string; // HH:MM 또는 HH:MM:SS
  end_time: string;
}

export interface CourseInput {
  title: string;
  professor?: string | null;
  kind: CourseKind;
  color: string;
  semester_start: string;
  semester_end: string;
  notes?: string | null;
  sessions: CourseSessionInput[];
}

function normalizeTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

export async function createCourse(
  supabase: SupabaseClient,
  userId: string,
  input: CourseInput,
): Promise<{ course: CourseWithSessions | null; error: string | null }> {
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      title: input.title,
      professor: input.professor || null,
      kind: input.kind,
      color: input.color,
      semester_start: input.semester_start,
      semester_end: input.semester_end,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error || !course) {
    console.error(error);
    return { course: null, error: "과목 저장에 실패했어요." };
  }

  const { error: sessionError } = await supabase.from("course_sessions").insert(
    input.sessions.map((s) => ({
      course_id: course.id,
      user_id: userId,
      day_of_week: s.day_of_week,
      start_time: normalizeTime(s.start_time),
      end_time: normalizeTime(s.end_time),
    })),
  );

  if (sessionError) {
    console.error(sessionError);
    return { course: null, error: "수업 시간 저장에 실패했어요." };
  }

  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("*")
    .eq("course_id", course.id)
    .order("start_time", { ascending: true });

  return { course: { ...(course as Course), sessions: (sessions as CourseSession[]) ?? [] }, error: null };
}

export async function updateCourse(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  input: CourseInput,
): Promise<{ course: CourseWithSessions | null; error: string | null }> {
  const { data: course, error } = await supabase
    .from("courses")
    .update({
      title: input.title,
      professor: input.professor || null,
      kind: input.kind,
      color: input.color,
      semester_start: input.semester_start,
      semester_end: input.semester_end,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .select()
    .single();

  if (error || !course) {
    console.error(error);
    return { course: null, error: "과목 수정에 실패했어요." };
  }

  // 시간 목록은 통째로 교체 (수정 폼이 항상 전체 목록을 다시 보내주므로 diff 없이 지우고 다시 넣음)
  const { error: deleteError } = await supabase.from("course_sessions").delete().eq("course_id", courseId);
  if (deleteError) {
    console.error(deleteError);
    return { course: null, error: "수업 시간 수정에 실패했어요." };
  }

  const { error: insertError } = await supabase.from("course_sessions").insert(
    input.sessions.map((s) => ({
      course_id: courseId,
      user_id: userId,
      day_of_week: s.day_of_week,
      start_time: normalizeTime(s.start_time),
      end_time: normalizeTime(s.end_time),
    })),
  );
  if (insertError) {
    console.error(insertError);
    return { course: null, error: "수업 시간 수정에 실패했어요." };
  }

  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("*")
    .eq("course_id", courseId)
    .order("start_time", { ascending: true });

  return { course: { ...(course as Course), sessions: (sessions as CourseSession[]) ?? [] }, error: null };
}

export async function deleteCourse(supabase: SupabaseClient, courseId: string): Promise<string | null> {
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) {
    console.error(error);
    return "과목 삭제에 실패했어요.";
  }
  return null;
}

export interface CourseOccurrence {
  course: CourseWithSessions;
  session: CourseSession;
  dateKey: string;
}

// 요청한 날짜 범위 안에서, 학기 기간(semester_start~end)에 걸리고 요일이 맞는 수업 회차를 전개.
// 주간 캘린더/일일 플래너에 "일정처럼" 보여주기 위한 용도 — events 테이블에 실제로 저장하지는 않음.
export function expandCourseOccurrences(
  courses: CourseWithSessions[],
  rangeStartKey: string,
  rangeEndKey: string,
): CourseOccurrence[] {
  const occurrences: CourseOccurrence[] = [];

  for (const course of courses) {
    const start = course.semester_start > rangeStartKey ? course.semester_start : rangeStartKey;
    const end = course.semester_end < rangeEndKey ? course.semester_end : rangeEndKey;
    if (start > end || course.sessions.length === 0) continue;

    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
    for (const day of days) {
      const dow = day.getDay();
      const dateKey = toDateKey(day);
      for (const session of course.sessions) {
        if (session.day_of_week === dow) {
          occurrences.push({ course, session, dateKey });
        }
      }
    }
  }

  return occurrences.sort((a, b) => a.session.start_time.localeCompare(b.session.start_time));
}

export type CourseKind = "class" | "ta";

export interface CourseSession {
  id: string;
  course_id: string;
  user_id: string;
  day_of_week: number; // 0=일 1=월 ... 6=토 (JS Date.getDay() 기준)
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  professor: string | null;
  kind: CourseKind;
  color: string; // hex
  semester_start: string; // YYYY-MM-DD
  semester_end: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithSessions extends Course {
  sessions: CourseSession[];
}

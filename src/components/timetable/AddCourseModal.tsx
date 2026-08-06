"use client";

import { PixelModal } from "@/components/ui/PixelModal";
import { CourseForm } from "@/components/timetable/CourseForm";
import type { CourseWithSessions } from "@/types/course";

interface AddCourseModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCreated: (course: CourseWithSessions) => void;
}

export function AddCourseModal({ open, onClose, userId, onCreated }: AddCourseModalProps) {
  if (!open) return null;

  return (
    <PixelModal open={open} onClose={onClose} title="과목 등록" emoji="📚">
      <CourseForm
        userId={userId}
        onSaved={(course) => {
          onCreated(course);
          onClose();
        }}
        onCancel={onClose}
      />
    </PixelModal>
  );
}

"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel, deleteEvent, duplicateEvent, eventColor } from "@/lib/events";
import {
  attachmentUrl,
  deleteAttachment,
  fetchAttachmentsForEvent,
  isImageMime,
  updateAttachmentWidth,
  uploadAttachment,
} from "@/lib/attachments";
import type { PlannerEvent } from "@/types/event";
import type { EventAttachment } from "@/types/attachment";
import { PixelModal } from "@/components/ui/PixelModal";
import { PixelButton } from "@/components/ui/PixelButton";
import { EventForm } from "@/components/calendar/EventForm";

interface EventDetailModalProps {
  event: PlannerEvent;
  userId: string;
  onClose: () => void;
  onUpdated: (event: PlannerEvent) => void;
  onDeleted: (eventId: string) => void;
  onDuplicated: (event: PlannerEvent) => void;
}

// 부모에서 key={event.id}로 렌더링해야 이벤트가 바뀔 때 내부 상태(모드/첨부파일 등)가 새로 초기화됨
export function EventDetailModal({
  event,
  userId,
  onClose,
  onUpdated,
  onDeleted,
  onDuplicated,
}: EventDetailModalProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    fetchAttachmentsForEvent(supabase, event.id).then(setAttachments);
  }, [event.id]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const { attachment, error: err } = await uploadAttachment(supabase, {
        userId,
        eventId: event.id,
        file,
      });
      if (err || !attachment) {
        setError(err ?? "파일 업로드에 실패했어요.");
        continue;
      }
      setAttachments((prev) => [...prev, attachment]);
    }
    setUploading(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleDeleteAttachment(attachment: EventAttachment) {
    const supabase = createClient();
    const err = await deleteAttachment(supabase, attachment);
    if (err) {
      setError(err);
      return;
    }
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  function handleResize(attachmentId: string, width: number) {
    setAttachments((prev) => prev.map((a) => (a.id === attachmentId ? { ...a, width } : a)));
  }

  async function persistResize(attachmentId: string, width: number) {
    const supabase = createClient();
    await updateAttachmentWidth(supabase, attachmentId, width);
  }

  async function handleDelete() {
    const supabase = createClient();
    const err = await deleteEvent(supabase, event.id);
    if (err) {
      setError(err);
      return;
    }
    onDeleted(event.id);
    onClose();
  }

  async function handleDuplicate() {
    const supabase = createClient();
    const { event: copy, error: err } = await duplicateEvent(supabase, event);
    if (err || !copy) {
      setError(err ?? "일정 복제에 실패했어요.");
      return;
    }
    onDuplicated(copy);
    onClose();
  }

  const isRange = Boolean(event.event_end_date) && event.event_end_date !== event.event_date;
  const dateLabel = isRange ? `${event.event_date} ~ ${event.event_end_date}` : event.event_date;
  const timeLabel = event.event_time
    ? `${event.event_time.slice(0, 5)}${event.end_time ? ` ~ ${event.end_time.slice(0, 5)}` : ""}`
    : "";

  const images = attachments.filter((a) => isImageMime(a.mime_type));
  const files = attachments.filter((a) => !isImageMime(a.mime_type));
  const supabase = createClient();

  if (mode === "edit") {
    return (
      <PixelModal open onClose={onClose} title="일정 수정" emoji="✏️">
        <EventForm
          userId={userId}
          initialEvent={event}
          onSaved={(updated) => {
            onUpdated(updated);
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      </PixelModal>
    );
  }

  return (
    <PixelModal open onClose={onClose} title={event.title} emoji="📌">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-block font-body text-xs px-2 py-1 border-2 border-pixel-border rounded-[6px]"
            style={{ backgroundColor: eventColor(event), color: "var(--pixel-chip-ink)" }}
          >
            {categoryLabel(event.category)}
          </span>
          <span className="font-body text-sm text-pixel-ink-soft">
            {dateLabel}
            {timeLabel ? ` · ${timeLabel}` : ""}
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col gap-2 border-2 rounded-[10px] p-2.5 transition-colors ${
            dragActive ? "border-pixel-blue bg-pixel-blue/10" : "border-pixel-border bg-pixel-bg"
          }`}
        >
          {event.description ? (
            <p className="font-body text-sm whitespace-pre-wrap break-words">{event.description}</p>
          ) : (
            <p className="font-body text-sm text-pixel-ink-soft">메모가 없어요.</p>
          )}

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-1">
              {images.map((img) => (
                <div key={img.id} className="flex flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 임의 크기 외부 스토리지 이미지, next/image 최적화 불필요 */}
                  <img
                    src={attachmentUrl(supabase, img.file_path)}
                    alt={img.file_name}
                    style={{ width: img.width ?? 280 }}
                    className="rounded-[8px] border-2 border-pixel-border object-cover"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min={100}
                      max={640}
                      value={img.width ?? 280}
                      onChange={(e) => handleResize(img.id, Number(e.target.value))}
                      onMouseUp={(e) => persistResize(img.id, Number((e.target as HTMLInputElement).value))}
                      onTouchEnd={(e) => persistResize(img.id, Number((e.target as HTMLInputElement).value))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(img)}
                      className="font-body text-xs text-pixel-red cursor-pointer shrink-0"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="font-body text-xs text-pixel-ink-soft mt-1">
            이미지를 이 영역에 드래그해서 놓으면 바로 첨부돼요.
          </p>
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 border-2 border-pixel-border rounded-[8px] px-2.5 py-1.5 bg-pixel-bg"
              >
                <a
                  href={attachmentUrl(supabase, file.file_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-sm underline break-all"
                >
                  📎 {file.file_name}
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(file)}
                  className="font-body text-xs text-pixel-red cursor-pointer shrink-0"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <PixelButton
          type="button"
          tone="mint"
          className="text-sm px-3 py-1.5 w-fit"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "업로드 중..." : "📎 파일/사진 첨부"}
        </PixelButton>

        {error && <p className="font-body text-sm text-pixel-red">{error}</p>}

        <div className="flex gap-2 pt-2 border-t-2 border-pixel-border">
          <PixelButton type="button" className="flex-1" onClick={() => setMode("edit")}>
            수정
          </PixelButton>
          <PixelButton type="button" tone="purple" onClick={handleDuplicate}>
            복제
          </PixelButton>
          {confirmingDelete ? (
            <>
              <PixelButton type="button" tone="red" onClick={handleDelete}>
                정말 삭제
              </PixelButton>
              <PixelButton type="button" tone="ink" onClick={() => setConfirmingDelete(false)}>
                취소
              </PixelButton>
            </>
          ) : (
            <PixelButton type="button" tone="red" onClick={() => setConfirmingDelete(true)}>
              삭제
            </PixelButton>
          )}
        </div>
      </div>
    </PixelModal>
  );
}

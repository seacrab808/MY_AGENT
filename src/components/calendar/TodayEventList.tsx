"use client";

import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { categoryLabel, eventColor, isBarEvent, sortDailyEvents } from "@/lib/events";
import { RescheduleModal } from "@/components/calendar/RescheduleModal";
import type { EventCheckStatus, PlannerEvent } from "@/types/event";

interface TodayEventListProps {
  dateKey: string;
  events: PlannerEvent[];
  onSelect: (event: PlannerEvent) => void;
  onSetCheckStatus: (event: PlannerEvent, status: EventCheckStatus | null) => void;
  onReschedule: (event: PlannerEvent, newDateKey: string) => void;
  onReorder: (orderedEvents: PlannerEvent[]) => void;
}

export function TodayEventList({
  dateKey,
  events,
  onSelect,
  onSetCheckStatus,
  onReschedule,
  onReorder,
}: TodayEventListProps) {
  const sorted = useMemo(() => sortDailyEvents(events), [events]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [reschedulingEvent, setReschedulingEvent] = useState<PlannerEvent | null>(null);

  if (sorted.length === 0) {
    return <p className="font-body text-pixel-ink-soft text-sm py-3">등록된 일정이 없어요.</p>;
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    if (dragId && dragId !== targetId && overId !== targetId) setOverId(targetId);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    const draggedId = dragId;
    setDragId(null);
    setOverId(null);
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = sorted.findIndex((ev) => ev.id === draggedId);
    const toIndex = sorted.findIndex((ev) => ev.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered);
  }

  function handleXClick(event: PlannerEvent) {
    if (event.check_status === "x") {
      onSetCheckStatus(event, null);
      return;
    }
    setReschedulingEvent(event);
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {sorted.map((event) => {
          const bar = isBarEvent(event);
          const isRange = Boolean(event.event_end_date) && event.event_end_date !== event.event_date;
          const rangeLabel = isRange ? `${event.event_date} ~ ${event.event_end_date}` : "";
          const timeLabel = event.event_time
            ? `${event.event_time.slice(0, 5)}${event.end_time ? ` ~ ${event.end_time.slice(0, 5)}` : ""}`
            : "";
          const isDragging = dragId === event.id;
          const isOver = overId === event.id && !isDragging;
          const isDone = event.check_status === "o";
          const isSkipped = event.check_status === "x";

          return (
            <li key={event.id}>
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", event.id);
                  setDragId(event.id);
                }}
                onDragOver={(e) => handleDragOver(e, event.id)}
                onDragLeave={() => setOverId((cur) => (cur === event.id ? null : cur))}
                onDrop={(e) => handleDrop(e, event.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`flex items-center gap-2 rounded-[14px] border border-pixel-border/15 bg-pixel-bg pl-1 pr-2.5 py-2 transition-all ${
                  isDragging ? "opacity-40" : ""
                } ${isOver ? "outline outline-2 outline-pixel-blue outline-offset-1" : ""} ${
                  isDone || isSkipped ? "opacity-65" : ""
                }`}
                style={{ borderLeft: `4px solid ${eventColor(event)}` }}
              >
                <span
                  className="font-body text-pixel-ink-soft/70 cursor-grab active:cursor-grabbing select-none px-1 text-sm shrink-0"
                  aria-hidden
                  title="드래그해서 순서 변경"
                >
                  ⠿
                </span>

                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <span
                    className="shrink-0 font-body text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor: eventColor(event), color: "var(--pixel-chip-ink)" }}
                  >
                    {categoryLabel(event.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-body text-[15px] font-medium leading-snug truncate ${
                        isSkipped ? "line-through text-pixel-ink-soft" : ""
                      }`}
                    >
                      {event.title}
                    </p>
                    {(timeLabel || rangeLabel) && (
                      <p className="font-body text-xs text-pixel-ink-soft truncate">
                        {timeLabel || rangeLabel}
                      </p>
                    )}
                  </div>
                </button>

                {!bar && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCheckStatus(event, isDone ? null : "o");
                      }}
                      title="완료"
                      aria-pressed={isDone}
                      className={`font-body text-xs font-bold w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                        isDone
                          ? "bg-pixel-mint border-pixel-mint text-pixel-chip-ink"
                          : "border-pixel-border/25 text-pixel-ink-soft hover:border-pixel-mint hover:text-pixel-chip-ink"
                      }`}
                    >
                      O
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleXClick(event);
                      }}
                      title={isSkipped ? "체크 해제" : "못했어요 (미루기)"}
                      aria-pressed={isSkipped}
                      className={`font-body text-xs font-bold w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                        isSkipped
                          ? "bg-pixel-red border-pixel-red text-pixel-bg"
                          : "border-pixel-border/25 text-pixel-ink-soft hover:border-pixel-red hover:bg-pixel-red/80 hover:text-pixel-bg"
                      }`}
                    >
                      X
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {reschedulingEvent && (
        <RescheduleModal
          event={reschedulingEvent}
          baseDateKey={dateKey}
          onClose={() => setReschedulingEvent(null)}
          onConfirm={(newDateKey) => {
            onReschedule(reschedulingEvent, newDateKey);
            setReschedulingEvent(null);
          }}
        />
      )}
    </>
  );
}

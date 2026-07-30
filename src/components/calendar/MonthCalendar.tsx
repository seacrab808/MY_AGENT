"use client";

import { useMemo } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { toDateKey } from "@/lib/date";
import { eventColor, filterEventsForTab, groupEventsByDate } from "@/lib/events";
import type { PlannerEvent } from "@/types/event";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

interface BarSegment {
  event: PlannerEvent;
  startCol: number; // 1-7
  span: number;
  lane: number;
  roundedLeft: boolean;
  roundedRight: boolean;
}

function isMultiDay(event: PlannerEvent): boolean {
  return Boolean(event.event_end_date) && event.event_end_date !== event.event_date;
}

function computeWeekBars(weekStart: Date, weekEnd: Date, events: PlannerEvent[]): BarSegment[] {
  const overlapping = events
    .filter(isMultiDay)
    .filter((event) => {
      const start = parseISO(event.event_date);
      const end = parseISO(event.event_end_date as string);
      return end >= weekStart && start <= weekEnd;
    })
    .sort((a, b) => {
      if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
      return (b.event_end_date as string).localeCompare(a.event_end_date as string);
    });

  const segments: BarSegment[] = [];

  for (const event of overlapping) {
    const eventStart = parseISO(event.event_date);
    const eventEnd = parseISO(event.event_end_date as string);
    const clippedStart = maxDate([eventStart, weekStart]);
    const clippedEnd = minDate([eventEnd, weekEnd]);
    const startCol = differenceInCalendarDays(clippedStart, weekStart) + 1;
    const endCol = differenceInCalendarDays(clippedEnd, weekStart) + 1;
    const span = endCol - startCol + 1;

    let lane = 0;
    while (
      segments.some(
        (seg) => seg.lane === lane && !(endCol < seg.startCol || startCol > seg.startCol + seg.span - 1),
      )
    ) {
      lane++;
    }

    segments.push({
      event,
      startCol,
      span,
      lane,
      roundedLeft: clippedStart.getTime() === eventStart.getTime(),
      roundedRight: clippedEnd.getTime() === eventEnd.getTime(),
    });
  }

  return segments;
}

interface MonthCalendarProps {
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  events: PlannerEvent[];
  onSelectDate: (dateKey: string) => void;
}

export function MonthCalendar({ monthDate, onMonthChange, events, onSelectDate }: MonthCalendarProps) {
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const monthEvents = useMemo(() => filterEventsForTab(events, "month"), [events]);
  const monthEventsByDate = useMemo(() => groupEventsByDate(monthEvents), [monthEvents]);

  const weeks = useMemo(() => {
    const chunks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      chunks.push(allDays.slice(i, i + 7));
    }
    return chunks;
  }, [allDays]);

  return (
    <PixelCard>
      <div className="flex items-center justify-between mb-3">
        <PixelIconButton onClick={() => onMonthChange(subMonths(monthDate, 1))} aria-label="이전 달">
          {"<"}
        </PixelIconButton>
        <h2 className="font-cute text-2xl">{format(monthDate, "yyyy년 M월")}</h2>
        <PixelIconButton onClick={() => onMonthChange(addMonths(monthDate, 1))} aria-label="다음 달">
          {">"}
        </PixelIconButton>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="font-cute text-center text-sm text-pixel-ink-soft">
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((weekDays) => {
          const weekStart = weekDays[0];
          const weekEnd = weekDays[6];
          const bars = computeWeekBars(weekStart, weekEnd, monthEvents);
          const laneCount = bars.reduce((max, seg) => Math.max(max, seg.lane + 1), 0);

          return (
            <div key={toDateKey(weekStart)} className="relative">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const dateKey = toDateKey(day);
                  const dotEvents = (monthEventsByDate[dateKey] ?? []).filter((e) => !isMultiDay(e));
                  const inMonth = isSameMonth(day, monthDate);
                  const todayFlag = isToday(day);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => onSelectDate(dateKey)}
                      className={`min-h-[72px] sm:min-h-[86px] flex flex-col items-center justify-start p-1 rounded-[8px] border-2 cursor-pointer transition-transform ${
                        todayFlag
                          ? "border-pixel-border bg-gradient-to-b from-[#ffedb0] to-pixel-yellow shadow-[var(--pixel-bevel)]"
                          : "border-transparent hover:border-pixel-border hover:-translate-y-0.5"
                      } ${!inMonth ? "opacity-35" : ""}`}
                      style={{ paddingBottom: laneCount * 15 + 4 }}
                    >
                      <span className="font-cute text-base leading-none mt-1">{format(day, "d")}</span>
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dotEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: eventColor(event) }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {bars.length > 0 && (
                <div
                  className="absolute left-0 right-0 grid grid-cols-7 gap-x-1"
                  style={{ top: 26, gridAutoRows: 13, rowGap: 2 }}
                >
                  {bars.map((seg) => (
                    <div
                      key={`${seg.event.id}-${seg.startCol}`}
                      title={seg.event.title}
                      className={`flex items-center px-1 text-[10px] font-cute leading-none truncate border-y-2 border-pixel-border ${
                        seg.roundedLeft ? "rounded-l-[6px] border-l-2" : "-ml-1"
                      } ${seg.roundedRight ? "rounded-r-[6px] border-r-2" : "-mr-1"}`}
                      style={{
                        gridColumn: `${seg.startCol} / ${seg.startCol + seg.span}`,
                        gridRow: seg.lane + 1,
                        backgroundColor: eventColor(seg.event),
                        color: "var(--pixel-chip-ink)",
                      }}
                    >
                      {seg.roundedLeft ? seg.event.title : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PixelCard>
  );
}

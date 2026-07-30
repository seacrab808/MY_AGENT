"use client";

import { useState } from "react";
import { addYears, subYears } from "date-fns";
import { quarterKey, quarterLabel, shiftQuarter, yearKey } from "@/lib/period";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelIconButton } from "@/components/ui/PixelIconButton";
import { GoalList } from "@/components/goal/GoalList";
import { TodoList } from "@/components/todo/TodoList";

interface GoalsTabProps {
  userId: string;
}

function NavHeader({
  title,
  onPrev,
  onNext,
}: {
  title: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <PixelIconButton onClick={onPrev}>{"<"}</PixelIconButton>
      <h2 className="font-cute text-2xl">{title}</h2>
      <PixelIconButton onClick={onNext}>{">"}</PixelIconButton>
    </div>
  );
}

export function GoalsTab({ userId }: GoalsTabProps) {
  const [quarterAnchor, setQuarterAnchor] = useState(() => new Date());
  const [yearAnchor, setYearAnchor] = useState(() => new Date());

  const qKey = quarterKey(quarterAnchor);
  const yKey = yearKey(yearAnchor);

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <PixelCard>
        <NavHeader
          title={`${quarterLabel(quarterAnchor)} 목표`}
          onPrev={() => setQuarterAnchor((d) => shiftQuarter(d, -1))}
          onNext={() => setQuarterAnchor((d) => shiftQuarter(d, 1))}
        />
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-cute text-lg mb-1">🎯 분기 목표</h3>
            <GoalList userId={userId} scope="quarter" periodKey={qKey} />
          </div>
          <div>
            <h3 className="font-cute text-lg mb-1">📝 분기 TODO</h3>
            <TodoList userId={userId} scope="quarter" periodKey={qKey} />
          </div>
        </div>
      </PixelCard>

      <PixelCard>
        <NavHeader
          title={`${yKey}년 목표`}
          onPrev={() => setYearAnchor((d) => subYears(d, 1))}
          onNext={() => setYearAnchor((d) => addYears(d, 1))}
        />
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-cute text-lg mb-1">🎯 연간 목표</h3>
            <GoalList userId={userId} scope="year" periodKey={yKey} />
          </div>
          <div>
            <h3 className="font-cute text-lg mb-1">📝 연간 TODO</h3>
            <TodoList userId={userId} scope="year" periodKey={yKey} />
          </div>
        </div>
      </PixelCard>
    </div>
  );
}

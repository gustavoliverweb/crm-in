"use client";

import { cn } from "@/lib/utils";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { formatDayLabel, formatTimeInput, isSameDay, pad2 } from "./agenda-utils";
import { KIND_STYLES, type AgendaItem } from "./agenda-items";
import { deleteScheduleBlock } from "./actions";

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 21;
const HOUR_HEIGHT = 56;
const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

function minutesSinceGridStart(date: Date) {
  return (date.getHours() - GRID_START_HOUR) * 60 + date.getMinutes();
}

function DayColumn({
  day,
  items,
  onItemClick,
}: {
  day: Date;
  items: AgendaItem[];
  onItemClick: (item: AgendaItem) => void;
}) {
  const today = isSameDay(day, new Date());
  const timedItems = items.filter((item) => !item.allDay && isSameDay(item.startsAt, day));
  const now = new Date();
  const nowTop = minutesSinceGridStart(now);

  return (
    <div className="relative border-l border-slate-100" style={{ height: GRID_HEIGHT }}>
      {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-slate-100"
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}

      {today && nowTop >= 0 && nowTop <= TOTAL_HOURS * 60 ? (
        <div
          className="absolute inset-x-0 z-20 border-t-2 border-red-500"
          style={{ top: (nowTop / 60) * HOUR_HEIGHT }}
        >
          <span className="absolute top-[-4px] left-0 size-2 rounded-full bg-red-500" />
        </div>
      ) : null}

      {timedItems.map((item) => {
        const top = Math.max(0, (minutesSinceGridStart(item.startsAt) / 60) * HOUR_HEIGHT);
        const height = Math.max(20, (item.durationMinutes / 60) * HOUR_HEIGHT);
        const style = KIND_STYLES[item.kind];

        if (item.kind === "bloqueo") {
          return (
            <div
              key={item.id}
              className={cn(
                "absolute inset-x-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs",
                style.bg,
                style.border,
                style.text,
              )}
              style={{ top, height, backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 4px, transparent 4px, transparent 8px)" }}
            >
              <div className="absolute top-0.5 right-0.5">
                <DeleteConfirmButton
                  description="Se eliminará este bloqueo de horario."
                  onConfirm={() => deleteScheduleBlock(item.id)}
                />
              </div>
              <p className="truncate pr-4 font-medium">{item.title}</p>
              {item.subtitle ? <p className="truncate opacity-75">{item.subtitle}</p> : null}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item)}
            className={cn(
              "absolute inset-x-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs hover:brightness-95",
              style.bg,
              style.border,
              style.text,
            )}
            style={{ top, height }}
          >
            <p className="truncate font-medium">
              {formatTimeInput(item.startsAt)} · {item.title}
            </p>
            {item.subtitle ? <p className="truncate opacity-75">{item.subtitle}</p> : null}
          </button>
        );
      })}
    </div>
  );
}

export function CalendarGrid({
  days,
  items,
  onItemClick,
}: {
  days: Date[];
  items: AgendaItem[];
  onItemClick: (item: AgendaItem) => void;
}) {
  const allDayItems = items.filter((item) => item.allDay);
  const hasAllDay = allDayItems.length > 0;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div
        className="grid"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border-l border-slate-100 py-2 text-center text-sm font-semibold",
              isSameDay(day, new Date()) ? "text-emerald-600" : "text-slate-700",
            )}
          >
            {formatDayLabel(day)}
          </div>
        ))}
      </div>

      {hasAllDay ? (
        <div
          className="grid border-t border-slate-100"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="py-1.5 pr-2 text-right text-[10px] text-slate-400">Todo el día</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="space-y-1 border-l border-slate-100 p-1">
              {allDayItems
                .filter((item) => isSameDay(item.startsAt, day))
                .map((item) => {
                  const style = KIND_STYLES[item.kind];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemClick(item)}
                      className={cn(
                        "block w-full truncate rounded px-1.5 py-0.5 text-left text-xs",
                        style.bg,
                        style.text,
                      )}
                    >
                      {item.title}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex max-h-[600px] overflow-y-auto border-t border-slate-100">
        <div className="grid flex-1" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right text-xs text-slate-400"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {pad2(GRID_START_HOUR + i)}:00
              </div>
            ))}
          </div>
          {days.map((day) => (
            <DayColumn key={day.toISOString()} day={day} items={items} onItemClick={onItemClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

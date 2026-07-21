"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { formatTimeInput, isSameDay } from "./agenda-utils";
import { KIND_STYLES, type AgendaItem } from "./agenda-items";
import { deleteScheduleBlock } from "./actions";

export function AgendaListView({
  days,
  items,
  onItemClick,
}: {
  days: Date[];
  items: AgendaItem[];
  onItemClick: (item: AgendaItem) => void;
}) {
  const dayGroups = days
    .map((day) => ({
      day,
      dayItems: items.filter((item) => isSameDay(item.startsAt, day)),
    }))
    .filter((g) => g.dayItems.length > 0);

  if (dayGroups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
        No hay elementos programados en este rango.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {dayGroups.map(({ day, dayItems }) => (
        <div key={day.toISOString()}>
          <h3 className="mb-2 text-sm font-semibold text-slate-700 capitalize">
            {day.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {dayItems.map((item) => {
              const style = KIND_STYLES[item.kind];
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-14 shrink-0 text-xs font-medium text-slate-500">
                    {item.allDay ? "Todo el día" : formatTimeInput(item.startsAt)}
                  </span>
                  <Badge className={cn(style.bg, style.text, "border-0")}>{style.label}</Badge>
                  {item.kind === "bloqueo" ? (
                    <>
                      <div className="flex-1 truncate text-sm text-slate-600">
                        {item.title}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </div>
                      <DeleteConfirmButton
                        description="Se eliminará este bloqueo de horario."
                        onConfirm={() => deleteScheduleBlock(item.id)}
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onItemClick(item)}
                      className="flex-1 truncate text-left text-sm font-medium text-slate-900 hover:underline"
                    >
                      {item.title}
                      {item.subtitle ? (
                        <span className="ml-1.5 font-normal text-slate-400">{item.subtitle}</span>
                      ) : null}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

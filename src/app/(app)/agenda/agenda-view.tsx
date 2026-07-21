"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, formatDateInput, weekDays } from "./agenda-utils";
import { buildAgendaItems, type AgendaItem } from "./agenda-items";
import { NewItemMenu } from "./new-item-menu";
import { CalendarGrid } from "./calendar-grid";
import { AgendaListView } from "./agenda-list-view";
import {
  AppointmentFormDialog,
  type AppointmentRecord,
  type ServiceOption,
  type StaffOption,
  type ClientOption,
} from "./appointment-form-dialog";
import {
  EventTaskFormDialog,
  type EventRecord,
  type TaskRecord,
} from "./event-task-form-dialog";
import type { ScheduleBlockRecord } from "./schedule-block-form-dialog";

type ViewMode = "week" | "day" | "list";

const TABS: { value: ViewMode; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "day", label: "Día" },
  { value: "list", label: "Lista" },
];

export function AgendaView({
  view,
  anchorDate,
  rangeStart,
  appointments,
  events,
  tasks,
  scheduleBlocks,
  serviceOptions,
  staffOptions,
  clientOptions,
}: {
  view: ViewMode;
  anchorDate: Date;
  rangeStart: Date;
  appointments: AppointmentRecord[];
  events: EventRecord[];
  tasks: TaskRecord[];
  scheduleBlocks: ScheduleBlockRecord[];
  serviceOptions: ServiceOption[];
  staffOptions: StaffOption[];
  clientOptions: ClientOption[];
}) {
  const [editing, setEditing] = useState<{ kind: AgendaItem["kind"]; id: string } | null>(null);

  const items = useMemo(
    () => buildAgendaItems(appointments, events, tasks, scheduleBlocks),
    [appointments, events, tasks, scheduleBlocks],
  );

  const days = view === "day" ? [rangeStart] : weekDays(rangeStart);
  const prevDate = view === "day" ? addDays(anchorDate, -1) : addDays(anchorDate, -7);
  const nextDate = view === "day" ? addDays(anchorDate, 1) : addDays(anchorDate, 7);

  const rangeLabel =
    view === "day"
      ? anchorDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
      : `${rangeStart.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} — ${addDays(
          rangeStart,
          6,
        ).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}`;

  function href(v: ViewMode, date: Date) {
    return `/agenda?view=${v}&date=${formatDateInput(date)}`;
  }

  const editingAppointment =
    editing?.kind === "cita" ? appointments.find((a) => a.id === editing.id) : undefined;
  const editingEvent =
    editing?.kind === "evento" ? events.find((e) => e.id === editing.id) : undefined;
  const editingTask = editing?.kind === "tarea" ? tasks.find((t) => t.id === editing.id) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <div className="mt-2 flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            {TABS.map((tab) => (
              <Link
                key={tab.value}
                href={href(tab.value, anchorDate)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  view === tab.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        <NewItemMenu
          defaultDate={anchorDate}
          serviceOptions={serviceOptions}
          staffOptions={staffOptions}
          clientOptions={clientOptions}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={href(view, prevDate)}>
          <Button variant="outline" size="icon-sm">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <Link href={href(view, new Date())}>
          <Button variant="outline" size="sm">
            Hoy
          </Button>
        </Link>
        <Link href={href(view, nextDate)}>
          <Button variant="outline" size="icon-sm">
            <ChevronRight className="size-4" />
          </Button>
        </Link>
        <span className="ml-2 text-sm font-semibold text-slate-700 capitalize">{rangeLabel}</span>
      </div>

      {view === "list" ? (
        <AgendaListView days={days} items={items} onItemClick={(item) => setEditing(item)} />
      ) : (
        <CalendarGrid days={days} items={items} onItemClick={(item) => setEditing(item)} />
      )}

      <AppointmentFormDialog
        open={editing?.kind === "cita"}
        onOpenChange={(v) => !v && setEditing(null)}
        item={editingAppointment}
        serviceOptions={serviceOptions}
        staffOptions={staffOptions}
        clientOptions={clientOptions}
      />
      <EventTaskFormDialog
        open={editing?.kind === "evento" || editing?.kind === "tarea"}
        onOpenChange={(v) => !v && setEditing(null)}
        eventItem={editingEvent}
        taskItem={editingTask}
        staffOptions={staffOptions}
      />
    </div>
  );
}

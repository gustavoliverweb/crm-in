import { combineDateAndTime, diffMinutes } from "./agenda-utils";
import type { AppointmentRecord } from "./appointment-form-dialog";
import type { EventRecord, TaskRecord } from "./event-task-form-dialog";
import type { ScheduleBlockRecord } from "./schedule-block-form-dialog";

export type AgendaItem =
  | {
      kind: "cita";
      id: string;
      startsAt: Date;
      durationMinutes: number;
      allDay: false;
      title: string;
      subtitle: string | null;
      data: AppointmentRecord;
    }
  | {
      kind: "evento";
      id: string;
      startsAt: Date;
      durationMinutes: number;
      allDay: boolean;
      title: string;
      subtitle: string | null;
      data: EventRecord;
    }
  | {
      kind: "tarea";
      id: string;
      startsAt: Date;
      durationMinutes: number;
      allDay: boolean;
      title: string;
      subtitle: string | null;
      data: TaskRecord;
    }
  | {
      kind: "bloqueo";
      id: string;
      startsAt: Date;
      durationMinutes: number;
      allDay: false;
      title: string;
      subtitle: string | null;
      data: ScheduleBlockRecord;
    };

export function buildAgendaItems(
  appointments: AppointmentRecord[],
  events: EventRecord[],
  tasks: TaskRecord[],
  scheduleBlocks: ScheduleBlockRecord[],
): AgendaItem[] {
  const citaItems: AgendaItem[] = appointments.map((a) => ({
    kind: "cita",
    id: a.id,
    startsAt: a.startsAt,
    durationMinutes: a.durationMinutes,
    allDay: false,
    title: a.serviceName ?? "Cita",
    subtitle: a.clientName,
    data: a,
  }));

  const eventoItems: AgendaItem[] = events.map((e) => ({
    kind: "evento",
    id: e.id,
    startsAt: e.startsAt,
    durationMinutes: e.durationMinutes,
    allDay: e.allDay,
    title: e.title,
    subtitle: e.location,
    data: e,
  }));

  const tareaItems: AgendaItem[] = tasks.map((t) => ({
    kind: "tarea",
    id: t.id,
    startsAt: t.startsAt,
    durationMinutes: t.durationMinutes,
    allDay: t.allDay,
    title: t.title,
    subtitle: t.assigneeName,
    data: t,
  }));

  const bloqueoItems: AgendaItem[] = scheduleBlocks.map((b) => ({
    kind: "bloqueo",
    id: b.id,
    startsAt: combineDateAndTime(b.date, b.startTime),
    durationMinutes: diffMinutes(b.startTime, b.endTime),
    allDay: false,
    title: b.scope === "NEGOCIO" ? "Negocio cerrado" : (b.employeeName ?? "Bloqueado"),
    subtitle: b.reason,
    data: b,
  }));

  return [...citaItems, ...eventoItems, ...tareaItems, ...bloqueoItems].sort(
    (x, y) => x.startsAt.getTime() - y.startsAt.getTime(),
  );
}

export const KIND_STYLES: Record<
  AgendaItem["kind"],
  { bg: string; border: string; text: string; label: string }
> = {
  cita: {
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-800",
    label: "Cita",
  },
  evento: {
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
    label: "Reunión",
  },
  tarea: {
    bg: "bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-800",
    label: "Tarea",
  },
  bloqueo: {
    bg: "bg-slate-200",
    border: "border-slate-300",
    text: "text-slate-600",
    label: "Bloqueado",
  },
};

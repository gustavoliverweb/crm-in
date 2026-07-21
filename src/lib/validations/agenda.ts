import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

const filterBlankStrings = (val: unknown) =>
  Array.isArray(val)
    ? val.filter((v) => typeof v === "string" && v.trim() !== "")
    : val;

export const appointmentSchema = z.object({
  catalogItemId: z.preprocess(emptyToUndefined, z.string().optional()),
  professionalId: z.preprocess(emptyToUndefined, z.string().optional()),
  clientId: z.preprocess(emptyToUndefined, z.string().optional()),
  date: z.string().min(1, "La fecha es obligatoria"),
  time: z.string().min(1, "La hora es obligatoria"),
  durationMinutes: z.preprocess(emptyToUndefined, z.coerce.number().int().min(5)).default(60),
  location: z.preprocess(emptyToUndefined, z.string().optional()),
  videoCallUrl: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z
    .preprocess(emptyToUndefined, z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"]))
    .default("PENDIENTE"),
});

export const eventSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  allDay: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  date: z.string().min(1, "La fecha es obligatoria"),
  time: z.string().min(1, "La hora es obligatoria"),
  durationMinutes: z.preprocess(emptyToUndefined, z.coerce.number().int().min(5)).default(60),
  staffUserIds: z.preprocess(filterBlankStrings, z.array(z.string())).default([]),
  externalGuestEmails: z.preprocess(filterBlankStrings, z.array(z.string())).default([]),
  location: z.preprocess(emptyToUndefined, z.string().optional()),
  videoCallUrl: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const taskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  allDay: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  date: z.string().min(1, "La fecha es obligatoria"),
  time: z.string().min(1, "La hora es obligatoria"),
  durationMinutes: z.preprocess(emptyToUndefined, z.coerce.number().int().min(5)).default(60),
  assigneeId: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const scheduleBlockSchema = z.object({
  scope: z.enum(["EMPLEADO", "NEGOCIO"]).default("EMPLEADO"),
  employeeId: z.preprocess(emptyToUndefined, z.string().optional()),
  date: z.string().min(1, "La fecha es obligatoria"),
  startTime: z.string().min(1, "La hora de inicio es obligatoria"),
  endTime: z.string().min(1, "La hora de fin es obligatoria"),
  reason: z.preprocess(emptyToUndefined, z.string().optional()),
});

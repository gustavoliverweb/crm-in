"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import {
  appointmentSchema,
  eventSchema,
  taskSchema,
  scheduleBlockSchema,
} from "@/lib/validations/agenda";

export type AgendaFormState = { error?: string; success?: boolean };

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

// ---------------------------------------------------------------------------
// Cita (Appointment)
// ---------------------------------------------------------------------------

function formDataToAppointmentInput(formData: FormData) {
  return appointmentSchema.safeParse({
    catalogItemId: formData.get("catalogItemId"),
    professionalId: formData.get("professionalId"),
    clientId: formData.get("clientId"),
    date: formData.get("date"),
    time: formData.get("time"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location"),
    videoCallUrl: formData.get("videoCallUrl"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });
}

export async function createAppointment(
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToAppointmentInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, time, ...data } = parsed.data;

  await prisma.appointment.create({
    data: {
      ...data,
      startsAt: combineDateTime(date, time),
      organizationId: membership.organizationId,
    },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function updateAppointment(
  appointmentId: string,
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Cita no encontrada" };
  }

  const parsed = formDataToAppointmentInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, time, ...data } = parsed.data;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { ...data, startsAt: combineDateTime(date, time) },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteAppointment(appointmentId: string) {
  const { membership } = await getActiveMembership();

  await prisma.appointment.deleteMany({
    where: { id: appointmentId, organizationId: membership.organizationId },
  });

  revalidatePath("/agenda");
}

// ---------------------------------------------------------------------------
// Reunión / Evento (Event)
// ---------------------------------------------------------------------------

function formDataToEventInput(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    allDay: formData.get("allDay"),
    date: formData.get("date"),
    time: formData.get("time"),
    durationMinutes: formData.get("durationMinutes"),
    staffUserIds: formData.getAll("staffUserIds"),
    externalGuestEmails: formData.getAll("externalGuestEmails"),
    location: formData.get("location"),
    videoCallUrl: formData.get("videoCallUrl"),
    notes: formData.get("notes"),
  });
}

export async function createEvent(
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToEventInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, time, ...data } = parsed.data;

  await prisma.event.create({
    data: {
      ...data,
      startsAt: combineDateTime(date, time),
      organizationId: membership.organizationId,
    },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function updateEvent(
  eventId: string,
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.event.findFirst({
    where: { id: eventId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Evento no encontrado" };
  }

  const parsed = formDataToEventInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, time, ...data } = parsed.data;

  await prisma.event.update({
    where: { id: eventId },
    data: { ...data, startsAt: combineDateTime(date, time) },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const { membership } = await getActiveMembership();

  await prisma.event.deleteMany({
    where: { id: eventId, organizationId: membership.organizationId },
  });

  revalidatePath("/agenda");
}

// ---------------------------------------------------------------------------
// Tarea (Task)
// ---------------------------------------------------------------------------

function formDataToTaskInput(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    allDay: formData.get("allDay"),
    date: formData.get("date"),
    time: formData.get("time"),
    durationMinutes: formData.get("durationMinutes"),
    assigneeId: formData.get("assigneeId"),
    notes: formData.get("notes"),
  });
}

export async function createTask(
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToTaskInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, time, ...data } = parsed.data;

  await prisma.task.create({
    data: {
      ...data,
      startsAt: combineDateTime(date, time),
      organizationId: membership.organizationId,
    },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function updateTask(
  taskId: string,
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const existing = await prisma.task.findFirst({
    where: { id: taskId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Tarea no encontrada" };
  }

  const parsed = formDataToTaskInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, time, ...data } = parsed.data;

  await prisma.task.update({
    where: { id: taskId },
    data: { ...data, startsAt: combineDateTime(date, time) },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const { membership } = await getActiveMembership();

  await prisma.task.deleteMany({
    where: { id: taskId, organizationId: membership.organizationId },
  });

  revalidatePath("/agenda");
}

export async function toggleTaskCompleted(taskId: string, completed: boolean) {
  const { membership } = await getActiveMembership();

  await prisma.task.updateMany({
    where: { id: taskId, organizationId: membership.organizationId },
    data: { completed },
  });

  revalidatePath("/agenda");
}

// ---------------------------------------------------------------------------
// Bloqueo de horario (ScheduleBlock)
// ---------------------------------------------------------------------------

function formDataToScheduleBlockInput(formData: FormData) {
  return scheduleBlockSchema.safeParse({
    scope: formData.get("scope"),
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  });
}

export async function createScheduleBlock(
  _prevState: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const { membership } = await getActiveMembership();

  const parsed = formDataToScheduleBlockInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { date, scope, employeeId, ...data } = parsed.data;

  await prisma.scheduleBlock.create({
    data: {
      ...data,
      scope,
      employeeId: scope === "NEGOCIO" ? undefined : employeeId,
      date: new Date(`${date}T00:00:00`),
      organizationId: membership.organizationId,
    },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteScheduleBlock(scheduleBlockId: string) {
  const { membership } = await getActiveMembership();

  await prisma.scheduleBlock.deleteMany({
    where: { id: scheduleBlockId, organizationId: membership.organizationId },
  });

  revalidatePath("/agenda");
}

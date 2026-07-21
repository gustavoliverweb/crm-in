import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { AgendaView } from "./agenda-view";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day; // semana empieza en lunes
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function parseDateParam(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function clientDisplayName(client: { isCompany: boolean; firstName: string; lastName: string | null }) {
  return client.isCompany ? client.firstName : `${client.firstName} ${client.lastName ?? ""}`.trim();
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "day" || params.view === "list" ? params.view : "week";
  const anchorDate = parseDateParam(params.date);

  const rangeStart = view === "day" ? startOfDay(anchorDate) : startOfWeek(anchorDate);
  const rangeEnd = view === "day" ? addDays(rangeStart, 1) : addDays(rangeStart, 7);

  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [appointments, events, tasks, scheduleBlocks, services, memberships, clients] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { organizationId, startsAt: { gte: rangeStart, lt: rangeEnd } },
        include: { client: true, catalogItem: true, professional: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.event.findMany({
        where: { organizationId, startsAt: { gte: rangeStart, lt: rangeEnd } },
        orderBy: { startsAt: "asc" },
      }),
      prisma.task.findMany({
        where: { organizationId, startsAt: { gte: rangeStart, lt: rangeEnd } },
        include: { assignee: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.scheduleBlock.findMany({
        where: { organizationId, date: { gte: rangeStart, lt: rangeEnd } },
        include: { employee: true },
        orderBy: { date: "asc" },
      }),
      prisma.catalogItem.findMany({
        where: { organizationId, type: "SERVICIO", active: true },
        orderBy: { name: "asc" },
      }),
      prisma.membership.findMany({
        where: { organizationId },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.client.findMany({
        where: { organizationId },
        orderBy: { firstName: "asc" },
      }),
    ]);

  const staffOptions = memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? m.user.email,
  }));

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
  }));

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: clientDisplayName(c),
    clientCode: c.clientCode,
    mobilePhone: c.mobilePhone,
    taxId: c.taxId,
  }));

  return (
    <AgendaView
      view={view}
      anchorDate={anchorDate}
      rangeStart={rangeStart}
      appointments={appointments.map((a) => ({
        id: a.id,
        startsAt: a.startsAt,
        durationMinutes: a.durationMinutes,
        location: a.location,
        videoCallUrl: a.videoCallUrl,
        notes: a.notes,
        status: a.status,
        catalogItemId: a.catalogItemId,
        professionalId: a.professionalId,
        clientId: a.clientId,
        clientName: a.client ? clientDisplayName(a.client) : null,
        serviceName: a.catalogItem?.name ?? null,
        professionalName: a.professional?.name ?? a.professional?.email ?? null,
      }))}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        allDay: e.allDay,
        startsAt: e.startsAt,
        durationMinutes: e.durationMinutes,
        staffUserIds: e.staffUserIds,
        externalGuestEmails: e.externalGuestEmails,
        location: e.location,
        videoCallUrl: e.videoCallUrl,
        notes: e.notes,
      }))}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        allDay: t.allDay,
        startsAt: t.startsAt,
        durationMinutes: t.durationMinutes,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.name ?? t.assignee?.email ?? null,
        notes: t.notes,
        completed: t.completed,
      }))}
      scheduleBlocks={scheduleBlocks.map((b) => ({
        id: b.id,
        scope: b.scope,
        employeeId: b.employeeId,
        employeeName: b.employee?.name ?? b.employee?.email ?? null,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
      }))}
      serviceOptions={serviceOptions}
      staffOptions={staffOptions}
      clientOptions={clientOptions}
    />
  );
}

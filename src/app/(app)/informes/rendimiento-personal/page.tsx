import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { computeLineTotals } from "@/lib/money-utils";
import { RendimientoPersonalView } from "./rendimiento-personal-view";

export default async function RendimientoPersonalPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [memberships, appointments, tasks, budgets] = await Promise.all([
    prisma.membership.findMany({ where: { organizationId }, include: { user: true } }),
    prisma.appointment.findMany({
      where: { organizationId },
      select: { professionalId: true, status: true, startsAt: true },
    }),
    prisma.task.findMany({
      where: { organizationId },
      select: { assigneeId: true, completed: true, startsAt: true },
    }),
    prisma.budget.findMany({
      where: { organizationId },
      include: { lines: true },
    }),
  ]);

  const members = memberships.map((m) => ({
    userId: m.userId,
    name: m.user.name ?? m.user.email,
  }));

  const appointmentRows = appointments.map((a) => ({
    professionalId: a.professionalId,
    status: a.status,
    startsAt: a.startsAt,
  }));

  const taskRows = tasks.map((t) => ({
    assigneeId: t.assigneeId,
    completed: t.completed,
    startsAt: t.startsAt,
  }));

  const budgetRows = budgets.map((b) => {
    const { total } = computeLineTotals(
      b.lines.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discountPct: Number(l.discountPct),
        vatRate: Number(l.vatRate),
      })),
      Number(b.discountPct),
    );
    return {
      salespersonId: b.salespersonId,
      status: b.status,
      createdAt: b.createdAt,
      total,
    };
  });

  return (
    <RendimientoPersonalView
      members={members}
      appointments={appointmentRows}
      tasks={taskRows}
      budgets={budgetRows}
    />
  );
}

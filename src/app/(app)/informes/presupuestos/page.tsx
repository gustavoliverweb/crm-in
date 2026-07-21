import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { computeLineTotals } from "@/lib/money-utils";
import { clientDisplayName } from "@/lib/client-display";
import { PresupuestosView } from "./presupuestos-view";

export default async function InformesPresupuestosPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const budgets = await prisma.budget.findMany({
    where: { organizationId },
    include: { client: true, lines: true },
  });

  const rows = budgets.map((b) => {
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
      id: b.id,
      clientName: b.client ? clientDisplayName(b.client) : null,
      createdAt: b.createdAt,
      status: b.status,
      total,
    };
  });

  return <PresupuestosView budgets={rows} />;
}

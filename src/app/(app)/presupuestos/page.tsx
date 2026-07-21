import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { PresupuestosTable } from "./presupuestos-table";
import { computeBudgetTotals, clientDisplayName } from "./budget-utils";

export default async function PresupuestosPage() {
  const { membership } = await getActiveMembership();

  const budgets = await prisma.budget.findMany({
    where: { organizationId: membership.organizationId },
    include: { client: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = budgets.map((b) => {
    const { total } = computeBudgetTotals(
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
      number: b.number,
      clientName: b.client ? clientDisplayName(b.client) : null,
      clientTaxId: b.client?.taxId ?? null,
      createdAt: b.createdAt,
      validUntil: b.validUntil,
      status: b.status,
      total,
    };
  });

  return <PresupuestosTable rows={rows} />;
}

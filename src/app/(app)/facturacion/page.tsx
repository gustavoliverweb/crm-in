import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { computeLineTotals } from "@/lib/money-utils";
import { clientDisplayName } from "@/lib/client-display";
import { FacturasTable } from "./facturas-table";

export default async function FacturacionPage() {
  const { membership } = await getActiveMembership();

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: membership.organizationId },
    include: { client: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = invoices.map((inv) => {
    const { baseImponible, ivaTotal, total } = computeLineTotals(
      inv.lines.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discountPct: Number(l.discountPct),
        vatRate: Number(l.vatRate),
      })),
      Number(inv.discountPct),
    );

    return {
      id: inv.id,
      number: inv.number,
      type: inv.type,
      clientName: inv.client ? clientDisplayName(inv.client) : null,
      clientTaxId: inv.client?.taxId ?? null,
      createdAt: inv.createdAt,
      dueDate: inv.dueDate,
      status: inv.status,
      baseImponible,
      ivaTotal,
      total,
    };
  });

  return <FacturasTable rows={rows} />;
}

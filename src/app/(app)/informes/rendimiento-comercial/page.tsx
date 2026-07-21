import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { computeLineTotals } from "@/lib/money-utils";
import { RendimientoComercialView } from "./rendimiento-comercial-view";

export default async function RendimientoComercialPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [clients, budgets, invoices] = await Promise.all([
    prisma.client.findMany({ where: { organizationId }, select: { createdAt: true } }),
    prisma.budget.findMany({
      where: { organizationId },
      include: { invoice: { select: { id: true } } },
    }),
    prisma.invoice.findMany({
      where: { organizationId },
      include: { lines: true },
    }),
  ]);

  const clientRows = clients.map((c) => ({ createdAt: c.createdAt }));

  const budgetRows = budgets.map((b) => ({
    createdAt: b.createdAt,
    status: b.status,
    hasInvoice: b.invoice !== null,
  }));

  const invoiceRows = invoices
    .filter((inv) => inv.status !== "BORRADOR")
    .map((inv) => {
      const { total } = computeLineTotals(
        inv.lines.map((l) => ({
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPct: Number(l.discountPct),
          vatRate: Number(l.vatRate),
        })),
        Number(inv.discountPct),
      );
      return { createdAt: inv.createdAt, total };
    });

  return (
    <RendimientoComercialView clients={clientRows} budgets={budgetRows} invoices={invoiceRows} />
  );
}

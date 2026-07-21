import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { computeLineTotals } from "@/lib/money-utils";
import { clientDisplayName } from "@/lib/client-display";
import { ResumenView } from "./resumen-view";

export default async function ResumenFacturacionPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [invoices, receivedInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId },
      include: { client: true, lines: true },
    }),
    prisma.receivedInvoice.findMany({
      where: { organizationId },
      include: { provider: true },
    }),
  ]);

  const invoiceRows = invoices.map((inv) => {
    const { ivaTotal, total } = computeLineTotals(
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
      clientName: inv.client ? clientDisplayName(inv.client) : null,
      createdAt: inv.createdAt,
      status: inv.status,
      ivaTotal,
      total,
    };
  });

  const receivedRows = receivedInvoices.map((r) => ({
    id: r.id,
    providerName: r.provider?.name ?? null,
    invoiceDate: r.invoiceDate,
    createdAt: r.createdAt,
    vatAmount: Number(r.vatAmount),
    totalAmount: Number(r.totalAmount),
  }));

  return <ResumenView invoices={invoiceRows} receivedInvoices={receivedRows} />;
}

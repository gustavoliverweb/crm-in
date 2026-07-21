import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { computeLineTotals } from "@/lib/money-utils";
import { ImpuestosView } from "./impuestos-view";

export default async function InformesImpuestosPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [invoices, receivedInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId, status: { not: "BORRADOR" } },
      include: { lines: true },
    }),
    prisma.receivedInvoice.findMany({ where: { organizationId } }),
  ]);

  const invoiceRows = invoices.map((inv) => {
    const { baseImponible, discountAmount, ivaTotal } = computeLineTotals(
      inv.lines.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discountPct: Number(l.discountPct),
        vatRate: Number(l.vatRate),
      })),
      Number(inv.discountPct),
    );
    const baseNeto = baseImponible - discountAmount;
    const irpfAmount = baseNeto * (Number(inv.irpfRate) / 100);

    return { createdAt: inv.createdAt, baseNeto, ivaTotal, irpfAmount };
  });

  const receivedRows = receivedInvoices.map((r) => ({
    date: r.invoiceDate ?? r.createdAt,
    baseAmount: Number(r.baseAmount),
    vatAmount: Number(r.vatAmount),
  }));

  return <ImpuestosView invoices={invoiceRows} receivedInvoices={receivedRows} />;
}

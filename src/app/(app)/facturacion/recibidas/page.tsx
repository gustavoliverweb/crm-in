import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { ReceivedInvoicesTable } from "./received-invoices-table";

export default async function RecibidasPage() {
  const { membership } = await getActiveMembership();

  const receivedInvoices = await prisma.receivedInvoice.findMany({
    where: { organizationId: membership.organizationId },
    include: { provider: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = receivedInvoices.map((r) => ({
    id: r.id,
    providerName: r.provider?.name ?? null,
    invoiceNumber: r.invoiceNumber,
    invoiceDate: r.invoiceDate,
    createdAt: r.createdAt,
    baseAmount: Number(r.baseAmount),
    vatAmount: Number(r.vatAmount),
    totalAmount: Number(r.totalAmount),
    status: r.status,
  }));

  return <ReceivedInvoicesTable rows={rows} />;
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { ReceivedInvoiceForm } from "../received-invoice-form";

export default async function EditarFacturaRecibidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [receivedInvoice, providers] = await Promise.all([
    prisma.receivedInvoice.findFirst({
      where: { id, organizationId },
      include: { lines: true },
    }),
    prisma.provider.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  if (!receivedInvoice) {
    redirect("/facturacion/recibidas");
  }

  return (
    <ReceivedInvoiceForm
      receivedInvoice={{
        id: receivedInvoice.id,
        providerId: receivedInvoice.providerId,
        invoiceNumber: receivedInvoice.invoiceNumber,
        invoiceDate: receivedInvoice.invoiceDate,
        baseAmount: Number(receivedInvoice.baseAmount),
        vatAmount: Number(receivedInvoice.vatAmount),
        totalAmount: Number(receivedInvoice.totalAmount),
        status: receivedInvoice.status,
        lines: receivedInvoice.lines.map((l) => ({
          productName: l.productName,
          sku: l.sku,
          quantity: Number(l.quantity),
          unit: l.unit,
          unitPrice: Number(l.unitPrice),
          total: Number(l.total),
        })),
      }}
      providerOptions={providers.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}

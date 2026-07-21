import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { clientDisplayName } from "@/lib/client-display";
import { renderVerifactuQrDataUrl } from "@/lib/verifactu";
import { InvoiceForm } from "../invoice-form";

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [invoice, services, products, appointments, clients] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { client: true, lines: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.catalogItem.findMany({
      where: { organizationId, type: "SERVICIO", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.catalogItem.findMany({
      where: { organizationId, type: "PRODUCTO", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: { organizationId, status: "COMPLETADA", catalogItemId: { not: null } },
      include: { catalogItem: true, client: true },
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
    prisma.client.findMany({ where: { organizationId }, orderBy: { firstName: "asc" } }),
  ]);

  if (!invoice) {
    redirect("/facturacion");
  }

  const verifactuQrImage = invoice.verifactuQrUrl
    ? await renderVerifactuQrDataUrl(invoice.verifactuQrUrl)
    : null;

  const toOption = (item: (typeof services)[number]) => ({
    id: item.id,
    name: item.name,
    basePrice: Number(item.basePrice),
    vatRate: Number(item.vatRate),
  });

  return (
    <InvoiceForm
      invoice={{
        id: invoice.id,
        number: invoice.number,
        clientId: invoice.clientId,
        clientName: invoice.client ? clientDisplayName(invoice.client) : null,
        type: invoice.type,
        irpfRate: Number(invoice.irpfRate),
        dueDate: invoice.dueDate,
        discountPct: Number(invoice.discountPct),
        status: invoice.status,
        verifactuHash: invoice.verifactuHash,
        verifactuQrData: invoice.verifactuQrData,
        verifactuQrImage,
        verifactuSubmissionStatus: invoice.verifactuSubmissionStatus,
        verifactuSubmissionError: invoice.verifactuSubmissionError,
        lines: invoice.lines.map((l) => ({
          catalogItemId: l.catalogItemId,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPct: Number(l.discountPct),
          vatRate: Number(l.vatRate),
        })),
      }}
      serviceOptions={services.map(toOption)}
      productOptions={products.map(toOption)}
      appointmentOptions={appointments
        .filter((a) => a.catalogItem)
        .map((a) => ({
          id: a.id,
          label: `${a.startsAt.toLocaleDateString("es-ES")} · ${a.catalogItem!.name}${a.client ? ` (${clientDisplayName(a.client)})` : ""}`,
          description: a.catalogItem!.name,
          unitPrice: Number(a.catalogItem!.basePrice),
          vatRate: Number(a.catalogItem!.vatRate),
        }))}
      clientOptions={clients.map((c) => ({
        id: c.id,
        name: clientDisplayName(c),
        clientCode: c.clientCode,
        mobilePhone: c.mobilePhone,
        taxId: c.taxId,
      }))}
    />
  );
}

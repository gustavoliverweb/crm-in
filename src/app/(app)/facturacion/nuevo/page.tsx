import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { clientDisplayName } from "@/lib/client-display";
import { InvoiceForm } from "../invoice-form";

export default async function NuevaFacturaPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [services, products, appointments, clients] = await Promise.all([
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

  const toOption = (item: (typeof services)[number]) => ({
    id: item.id,
    name: item.name,
    basePrice: Number(item.basePrice),
    vatRate: Number(item.vatRate),
  });

  return (
    <InvoiceForm
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

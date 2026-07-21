import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { BudgetForm } from "../budget-form";
import { clientDisplayName } from "../budget-utils";

export default async function NuevoPresupuestoPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [services, products, memberships, clients] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { organizationId, type: "SERVICIO", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.catalogItem.findMany({
      where: { organizationId, type: "PRODUCTO", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
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
    <BudgetForm
      serviceOptions={services.map(toOption)}
      productOptions={products.map(toOption)}
      staffOptions={memberships.map((m) => ({ id: m.user.id, name: m.user.name ?? m.user.email }))}
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

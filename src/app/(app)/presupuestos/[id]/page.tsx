import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { BudgetForm } from "../budget-form";
import { clientDisplayName } from "../budget-utils";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const [budget, services, products, memberships, clients] = await Promise.all([
    prisma.budget.findFirst({
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
    prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.findMany({ where: { organizationId }, orderBy: { firstName: "asc" } }),
  ]);

  if (!budget) {
    redirect("/presupuestos");
  }

  const toOption = (item: (typeof services)[number]) => ({
    id: item.id,
    name: item.name,
    basePrice: Number(item.basePrice),
    vatRate: Number(item.vatRate),
  });

  return (
    <BudgetForm
      budget={{
        id: budget.id,
        number: budget.number,
        clientId: budget.clientId,
        clientName: budget.client ? clientDisplayName(budget.client) : null,
        validUntil: budget.validUntil,
        irpfRate: Number(budget.irpfRate),
        salespersonId: budget.salespersonId,
        paymentTerms: budget.paymentTerms,
        notes: budget.notes,
        discountPct: Number(budget.discountPct),
        status: budget.status,
        lines: budget.lines.map((l) => ({
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

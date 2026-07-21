import { getActiveMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProveedoresView } from "./proveedores-view";

export default async function ProveedoresPage() {
  const { membership } = await getActiveMembership();
  const organizationId = membership.organizationId;

  const providers = await prisma.provider.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { receivedInvoices: { select: { totalAmount: true } } },
  });

  const rows = providers.map((p) => ({
    id: p.id,
    name: p.name,
    taxId: p.taxId,
    email: p.email,
    phone: p.phone,
    address: p.address,
    postalCode: p.postalCode,
    city: p.city,
    province: p.province,
    country: p.country,
    notes: p.notes,
    invoiceCount: p.receivedInvoices.length,
    totalPurchased: p.receivedInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
  }));

  return <ProveedoresView providers={rows} />;
}

import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/session";
import { ReceivedInvoiceForm } from "../received-invoice-form";

export default async function NuevaFacturaRecibidaPage() {
  const { membership } = await getActiveMembership();

  const providers = await prisma.provider.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <ReceivedInvoiceForm
      providerOptions={providers.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}

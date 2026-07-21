import { getActiveMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CatalogoTabs } from "./catalogo-tabs";
import type { CatalogItemType } from "./catalog-form-dialog";

export default async function CatalogoPage() {
  const { membership } = await getActiveMembership();

  const rawItems = await prisma.catalogItem.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { name: "asc" },
  });

  const items = rawItems.map((item) => ({
    ...item,
    basePrice: Number(item.basePrice),
    vatRate: Number(item.vatRate),
  }));

  const itemsByType: Record<CatalogItemType, typeof items> = {
    SERVICIO: items.filter((i) => i.type === "SERVICIO"),
    PRODUCTO: items.filter((i) => i.type === "PRODUCTO"),
    EXTRA: items.filter((i) => i.type === "EXTRA"),
  };

  return <CatalogoTabs itemsByType={itemsByType} />;
}

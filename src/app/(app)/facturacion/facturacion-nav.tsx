"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/facturacion", label: "Emitidas" },
  { href: "/facturacion/recibidas", label: "Recibidas" },
  { href: "/facturacion/resumen", label: "Ingresos/Gastos" },
];

export function FacturacionNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4 border-b border-slate-200 text-sm">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/facturacion" ? pathname === "/facturacion" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 pb-2 font-medium transition-colors",
              isActive
                ? "border-emerald-500 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

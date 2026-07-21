"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/informes", label: "Citas" },
  { href: "/informes/rendimiento-personal", label: "Rendimiento personal" },
  { href: "/informes/presupuestos", label: "Presupuestos" },
  { href: "/informes/rendimiento-comercial", label: "Rendimiento comercial" },
  { href: "/informes/impuestos", label: "Gestión de Impuestos" },
];

export function InformesNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 text-sm">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/informes" ? pathname === "/informes" : pathname.startsWith(tab.href);
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

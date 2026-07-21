"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/agenda", label: "Agenda" },
  { href: "/clientes", label: "Clientes" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/expedientes", label: "Expedientes" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/facturacion", label: "Facturación" },
  { href: "/informes", label: "Informes" },
  { href: "/configuracion", label: "Configuración" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-slate-300 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

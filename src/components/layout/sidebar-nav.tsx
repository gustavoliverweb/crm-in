"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Users,
  Tag,
  Truck,
  FolderKanban,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/catalogo", label: "Catálogo", icon: Tag },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/expedientes", label: "Expedientes", icon: FolderKanban },
  { href: "/presupuestos", label: "Presupuestos", icon: ClipboardList },
  { href: "/facturacion", label: "Facturación", icon: FileText },
  { href: "/informes", label: "Informes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-indigo-900 bg-indigo-950">
      <div className="px-5 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          intalva
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-900/60 text-white"
                  : "text-indigo-200/70 hover:bg-indigo-900/40 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

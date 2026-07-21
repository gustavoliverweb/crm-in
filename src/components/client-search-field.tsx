"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ClientOption = {
  id: string;
  name: string;
  clientCode: string | null;
  mobilePhone: string | null;
  taxId: string | null;
};

export function ClientSearchField({
  name = "clientId",
  options,
  value,
  onChange,
}: {
  name?: string;
  options: ClientOption[];
  value: { id: string; name: string } | null;
  onChange: (client: { id: string; name: string } | null) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [showResults, setShowResults] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((c) =>
        [c.name, c.clientCode, c.mobilePhone, c.taxId]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [options, query]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre, código, teléfono o DNI..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
            if (value) onChange(null);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
        />
      </div>
      {showResults && filtered.length > 0 ? (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-md">
          {filtered.map((c) => (
            <button
              type="button"
              key={c.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onMouseDown={() => {
                onChange({ id: c.id, name: c.name });
                setQuery(c.name);
                setShowResults(false);
              }}
            >
              {c.name}
              {c.clientCode ? (
                <span className="ml-1 text-xs text-slate-400">#{c.clientCode}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

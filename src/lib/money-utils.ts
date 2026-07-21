export type LineAmounts = {
  quantity: number;
  unitPrice: number;
  discountPct: number;
  vatRate: number;
};

export function computeLineTotals(lines: LineAmounts[], globalDiscountPct: number) {
  const baseImponible = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discountPct / 100),
    0,
  );
  const discountAmount = baseImponible * (globalDiscountPct / 100);
  const ivaTotal = lines.reduce((sum, l) => {
    const lineBase = l.quantity * l.unitPrice * (1 - l.discountPct / 100);
    return sum + lineBase * (1 - globalDiscountPct / 100) * (l.vatRate / 100);
  }, 0);
  const total = baseImponible - discountAmount + ivaTotal;

  return { baseImponible, discountAmount, ivaTotal, total };
}

export function formatEUR(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

export function calculateFitValue(items: Array<{ price?: number | string | null }>): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const price = parseFloat(String(item.price ?? 0));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
}

export function formatFitValue(value: number): string {
  if (value === 0) return "$0";
  return `$${value.toLocaleString()}`;
}

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  notation: "compact",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatCompactCurrency(amount: number) {
  return compactCurrencyFormatter.format(amount);
}

export function formatDateLabel(input: string) {
  return dateFormatter.format(new Date(input));
}

export const formatCurrency = (n: number, currency = "USD", digits = 2) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${currency === "INR" ? "₹" : "$"}${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${currency === "INR" ? "₹" : "$"}${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${currency === "INR" ? "₹" : "$"}${(n / 1e6).toFixed(2)}M`;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
};

export const formatNumber = (n: number, digits = 2) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(digits);
};

export const formatPercent = (n: number, digits = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const formatSigned = (n: number, digits = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

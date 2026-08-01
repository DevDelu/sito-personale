export { formatCurrency } from "@/lib/spese-utils";

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatQuantita(n: number): string {
  return n.toLocaleString("it-IT", { maximumFractionDigits: 6 });
}

export const TIPO_ASSET_LABEL: Record<string, string> = {
  stock: "Azioni",
  etf: "ETF/ETC",
  indice: "Indici",
  crypto: "Crypto",
};

export const TIPO_ASSET_COLOR_VAR: Record<string, string> = {
  stock: "--invest-stock",
  etf: "--invest-etf",
  indice: "--invest-indice",
  crypto: "--invest-crypto",
};

import {
  Banknote,
  CircleDashed,
  Fuel,
  Landmark,
  ShoppingCart,
  Undo2,
  UtensilsCrossed,
  Wallet,
  Shirt,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_STYLE: Record<string, { colorVar: string; icon: LucideIcon }> = {
  Alimentari: { colorVar: "--cat-alimentari", icon: ShoppingCart },
  Benzina: { colorVar: "--cat-benzina", icon: Fuel },
  Vinted: { colorVar: "--cat-vinted", icon: Shirt },
  PayPal: { colorVar: "--cat-paypal", icon: Wallet },
  Bonifici: { colorVar: "--cat-bonifici", icon: Landmark },
  Ristoranti: { colorVar: "--cat-ristoranti", icon: UtensilsCrossed },
  Stipendio: { colorVar: "--cat-stipendio", icon: Banknote },
  Rimborso: { colorVar: "--cat-rimborso", icon: Undo2 },
  Altro: { colorVar: "--cat-altro", icon: CircleDashed },
};

const DEFAULT_STYLE = { colorVar: "--cat-altro", icon: CircleDashed };

export function categoryColor(nome: string | null | undefined): string {
  const style = (nome && CATEGORY_STYLE[nome]) || DEFAULT_STYLE;
  return `var(${style.colorVar})`;
}

export function categoryIcon(nome: string | null | undefined): LucideIcon {
  const style = (nome && CATEGORY_STYLE[nome]) || DEFAULT_STYLE;
  return style.icon;
}

// Fonte unica del colore per categoria: preferisce il colore salvato in DB
// (categorie.colore, vedi supabase/005_gestione_movimenti.sql) e ricade sulla
// mappa statica solo se assente. Usata da CategoryPieChart e
// CategorySpendingTrendChart per restare sempre allineati tra loro.
export function resolveCategoryColor(
  nome: string | null | undefined,
  colore: string | null | undefined
): string {
  return colore || categoryColor(nome);
}

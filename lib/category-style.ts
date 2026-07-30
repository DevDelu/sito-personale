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

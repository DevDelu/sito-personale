import { createElement } from "react";
import { categoryColor, categoryIcon } from "@/lib/category-style";

export function CategoryBadge({ nome }: { nome: string | null }) {
  const color = categoryColor(nome);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ color, borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {createElement(categoryIcon(nome), { className: "h-3 w-3", strokeWidth: 2 })}
      {nome ?? "—"}
    </span>
  );
}

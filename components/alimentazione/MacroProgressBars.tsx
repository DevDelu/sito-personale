import type { MacroTotali } from "@/lib/alimentazione/types";

// Target macro non definiti dal calcolo TDEE (che copre solo le kcal):
// stima ragionevole di default, non richiesta esplicitamente dalla Fase A —
// proteine 1.8 g/kg di peso corporeo (comune sia in surplus che in deficit),
// grassi 25% delle kcal target, carboidrati il resto. Facile da rendere
// configurabile in una fase successiva se serve un target diverso.
export function stimaTargetMacro(targetKcal: number, pesoKg: number): MacroTotali {
  const proteine_g = Math.round(pesoKg * 1.8);
  const kcalGrassi = targetKcal * 0.25;
  const grassi_g = Math.round(kcalGrassi / 9);
  const kcalProteine = proteine_g * 4;
  const carboidrati_g = Math.max(0, Math.round((targetKcal - kcalProteine - kcalGrassi) / 4));
  return { kcal: targetKcal, proteine_g, carboidrati_g, grassi_g };
}

function Bar({
  label,
  value,
  target,
  unit,
  colorVar,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  colorVar: string;
}) {
  const pct = target && target > 0 ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-figures">
          {Math.round(value)}
          {unit}
          {target !== null && <span className="text-muted"> / {Math.round(target)}{unit}</span>}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct ?? 0}%`,
            backgroundColor: `var(${colorVar})`,
          }}
        />
      </div>
    </div>
  );
}

export function MacroProgressBars({
  consumo,
  target,
}: {
  consumo: MacroTotali;
  target: MacroTotali | null;
}) {
  return (
    <div className="card animate-slide-up flex flex-col gap-4 p-4">
      <Bar label="Kcal" value={consumo.kcal} target={target?.kcal ?? null} unit=" kcal" colorVar="--accent" />
      <Bar
        label="Proteine"
        value={consumo.proteine_g}
        target={target?.proteine_g ?? null}
        unit="g"
        colorVar="--macro-proteine"
      />
      <Bar
        label="Carboidrati"
        value={consumo.carboidrati_g}
        target={target?.carboidrati_g ?? null}
        unit="g"
        colorVar="--macro-carboidrati"
      />
      <Bar
        label="Grassi"
        value={consumo.grassi_g}
        target={target?.grassi_g ?? null}
        unit="g"
        colorVar="--macro-grassi"
      />
    </div>
  );
}

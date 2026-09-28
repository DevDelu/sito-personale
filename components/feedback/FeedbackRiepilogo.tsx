import type { Riepilogo } from "@/lib/feedback/riepilogo";

// Card riassuntiva in fondo a /feedback: contatori per gruppo di stato,
// tempo medio da invio a verificato, tasso di riapertura.
export function FeedbackRiepilogo({ riepilogo }: { riepilogo: Riepilogo }) {
  const s = riepilogo.perStato;
  const aperti = s.nuovo + s["preso-in-carico"] + s["serve-info"] + s["in-lavorazione"] + s.riaperto;
  const voci = [
    { label: "Aperti", valore: String(aperti) },
    { label: "Da verificare", valore: String(s["da-verificare"]) },
    { label: "Verificati", valore: String(s.verificato) },
    { label: "Scartati", valore: String(s.scartato) },
    {
      label: "Tempo medio fino a verificato",
      valore: riepilogo.giorniMediVerifica === null ? "N/D" : `${riepilogo.giorniMediVerifica.toLocaleString("it-IT")} gg`,
    },
    {
      label: "Riaperti",
      valore: riepilogo.tassoRiapertura === null ? "N/D" : `${Math.round(riepilogo.tassoRiapertura * 100)}%`,
    },
  ];

  return (
    <section className="card flex flex-col gap-3 p-4">
      <h2 className="text-[13px] font-medium text-muted uppercase">Riepilogo</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {voci.map((v) => (
          <div key={v.label} className="flex flex-col gap-0.5">
            <dt className="text-[13px] text-muted">{v.label}</dt>
            <dd className="font-figures text-[17px] font-semibold">{v.valore}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

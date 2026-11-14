// Schemi illustrativi (non dati reali) per le lezioni macro.

export function CurvaRendimenti() {
  const scadenze = ["3M", "2A", "5A", "10A", "30A"];
  const x = (i: number) => 40 + i * 70;
  const y = (r: number) => 150 - r * 25;
  const normale = [2.6, 3, 3.4, 3.9, 4.3];
  const invertita = [5.2, 4.8, 4.3, 4.1, 4.2];
  const linea = (v: number[]) => v.map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r)}`).join("");
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox="0 0 340 180" className="h-auto w-full" role="img" aria-label="Curva dei rendimenti normale e invertita">
        {[2, 3, 4, 5].map((r) => (
          <g key={r}>
            <line x1={30} x2={330} y1={y(r)} y2={y(r)} stroke="var(--border)" strokeWidth={0.6} />
            <text x={4} y={y(r) + 4} fontSize={12} fill="var(--muted)">{r}%</text>
          </g>
        ))}
        <path d={linea(normale)} fill="none" stroke="var(--entrata)" strokeWidth={2.5} />
        <path d={linea(invertita)} fill="none" stroke="var(--spesa)" strokeWidth={2.5} strokeDasharray="6 4" />
        {scadenze.map((s, i) => (
          <text key={s} x={x(i)} y={172} fontSize={12} textAnchor="middle" fill="var(--muted)">{s}</text>
        ))}
        <text x={x(4)} y={y(4.3) - 8} fontSize={12} textAnchor="end" fill="var(--entrata)">Normale</text>
        <text x={x(0) + 4} y={y(5.2) - 8} fontSize={12} fill="var(--spesa)">Invertita</text>
      </svg>
      <figcaption className="text-[13px] text-muted">
        Rendimento per scadenza. Normale: chi presta più a lungo chiede di più. Invertita: i tassi brevi superano i lunghi.
      </figcaption>
    </figure>
  );
}

const FASI = [
  { nome: "Ripresa", settori: "Consumi discrezionali, finanziari, immobiliare, small cap", colore: "var(--entrata)" },
  { nome: "Espansione", settori: "Tecnologia, industriali, comunicazioni", colore: "var(--cat-paypal)" },
  { nome: "Fine ciclo", settori: "Energia, materiali, salute", colore: "var(--cat-extra-3)" },
  { nome: "Recessione", settori: "Beni di prima necessità, utility, salute", colore: "var(--spesa)" },
];

export function CicloSettori() {
  return (
    <figure className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {FASI.map((f, i) => (
          <div key={f.nome} className="flex flex-col gap-1 rounded-[12px] border border-border bg-background p-3">
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.colore }} />
              {i + 1}. {f.nome}
            </span>
            <span className="text-[13px] text-muted">{f.settori}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-[13px] text-muted">
        Il modello classico di rotazione lungo il ciclo economico. È una mappa, non un orologio: ogni ciclo ha le sue eccezioni.
      </figcaption>
    </figure>
  );
}

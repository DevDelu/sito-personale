// Schemi disegnati a mano (non dati): l'anatomia di una candela e i pattern
// di candele più usati, con proporzioni esagerate per renderli leggibili.

type Forma = { open: number; close: number; high: number; low: number };

function CandelaSvg({ cx, k, scala, base, larghezza = 16 }: { cx: number; k: Forma; scala: number; base: number; larghezza?: number }) {
  const y = (p: number) => base - p * scala;
  const su = k.close >= k.open;
  const colore = su ? "var(--entrata)" : "var(--spesa)";
  return (
    <g>
      <line x1={cx} x2={cx} y1={y(k.high)} y2={y(k.low)} stroke={colore} strokeWidth={2} />
      <rect
        x={cx - larghezza / 2}
        y={y(Math.max(k.open, k.close))}
        width={larghezza}
        height={Math.max(2, Math.abs(k.open - k.close) * scala)}
        fill={colore}
      />
    </g>
  );
}

export function AnatomiaCandela() {
  const etichetta = (y: number, testo: string, x = 150) => (
    <g>
      <line x1={x - 52} x2={x - 6} y1={y} y2={y} stroke="var(--muted)" strokeDasharray="2 2" />
      <text x={x} y={y + 4} fontSize={13} fill="var(--foreground)">{testo}</text>
    </g>
  );
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox="0 0 340 200" className="h-auto w-full" role="img" aria-label="Anatomia di una candela rialzista e ribassista">
        {/* Rialzista */}
        <line x1={60} x2={60} y1={20} y2={180} stroke="var(--entrata)" strokeWidth={3} />
        <rect x={42} y={55} width={36} height={90} fill="var(--entrata)" />
        <text x={60} y={196} fontSize={13} textAnchor="middle" fill="var(--entrata)">Rialzista</text>
        {/* Ribassista */}
        <line x1={250} x2={250} y1={30} y2={175} stroke="var(--spesa)" strokeWidth={3} />
        <rect x={232} y={60} width={36} height={80} fill="var(--spesa)" />
        <text x={250} y={196} fontSize={13} textAnchor="middle" fill="var(--spesa)">Ribassista</text>
        {etichetta(20, "Massimo (high)", 112)}
        {etichetta(55, "Chiusura (close)", 112)}
        {etichetta(145, "Apertura (open)", 112)}
        {etichetta(180, "Minimo (low)", 112)}
        <text x={60} y={104} fontSize={12} textAnchor="middle" fill="var(--background)">corpo</text>
        <text x={258} y={46} fontSize={12} fill="var(--muted)">ombra</text>
      </svg>
      <figcaption className="text-[13px] text-muted">
        Verde: ha chiuso sopra l&apos;apertura. Rossa: ha chiuso sotto. Nella rossa l&apos;apertura è in alto e la chiusura in basso.
      </figcaption>
    </figure>
  );
}

const PATTERN: { nome: string; segnale: "rialzista" | "ribassista" | "indecisione"; candele: Forma[]; spiegazione: string }[] = [
  {
    nome: "Martello",
    segnale: "rialzista",
    candele: [{ open: 7, close: 7.6, high: 7.8, low: 3 }],
    spiegazione: "Dopo un ribasso: i venditori spingono giù, ma i compratori riportano il prezzo in alto. Ombra inferiore almeno doppia del corpo.",
  },
  {
    nome: "Stella cadente",
    segnale: "ribassista",
    candele: [{ open: 4.4, close: 3.8, high: 8.6, low: 3.6 }],
    spiegazione: "Dopo un rialzo: tentativo di salita respinto. È il martello capovolto, in cima al movimento.",
  },
  {
    nome: "Doji",
    segnale: "indecisione",
    candele: [{ open: 5.6, close: 5.7, high: 8, low: 3.2 }],
    spiegazione: "Apertura ≈ chiusura: equilibrio tra compratori e venditori. Conta dove compare, non da solo.",
  },
  {
    nome: "Engulfing rialzista",
    segnale: "rialzista",
    candele: [
      { open: 6.4, close: 5, high: 6.7, low: 4.7 },
      { open: 4.6, close: 7.2, high: 7.5, low: 4.4 },
    ],
    spiegazione: "Una candela verde “ingloba” tutto il corpo della rossa precedente: i compratori prendono il controllo.",
  },
  {
    nome: "Engulfing ribassista",
    segnale: "ribassista",
    candele: [
      { open: 5, close: 6.4, high: 6.7, low: 4.8 },
      { open: 6.8, close: 4.4, high: 7, low: 4.1 },
    ],
    spiegazione: "Il contrario: la rossa ingloba la verde, i venditori prendono il controllo.",
  },
];

export function PatternCandele() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PATTERN.map((p) => (
        <div key={p.nome} className="flex items-center gap-3 rounded-[var(--app-card-radius)] border border-border bg-background p-3">
          <svg viewBox="0 0 70 100" className="h-24 w-16 shrink-0" role="img" aria-label={p.nome}>
            {p.candele.map((k, i) => (
              <CandelaSvg key={i} cx={p.candele.length === 1 ? 35 : 22 + i * 26} k={k} scala={10} base={95} larghezza={p.candele.length === 1 ? 18 : 16} />
            ))}
          </svg>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[15px] font-semibold">
              {p.nome}{" "}
              <span
                className={`text-[13px] font-medium ${
                  p.segnale === "rialzista" ? "text-entrata" : p.segnale === "ribassista" ? "text-spesa" : "text-muted"
                }`}
              >
                · {p.segnale}
              </span>
            </span>
            <span className="text-[13px] text-muted">{p.spiegazione}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

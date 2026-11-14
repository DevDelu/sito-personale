"use client";

import { useMemo, useRef, useState } from "react";
import { Eraser, Minus, MousePointer2, TrendingUp } from "lucide-react";
import {
  bollinger,
  ema,
  macd,
  ritracciamentiFibonacci,
  rsi,
  sma,
  type Candela,
  type Serie,
} from "@/lib/trading/indicatori";
import { SCENARI, candeleScenario, scenarioCasuale, type Scenario } from "@/lib/trading/scenari";

export type Strumento =
  | "sma20"
  | "sma50"
  | "sma200"
  | "ema20"
  | "bollinger"
  | "livelli"
  | "trendline"
  | "fibonacci"
  | "annotazioni"
  | "volumi"
  | "rsi"
  | "macd";

const ETICHETTE: Record<Strumento, { nome: string; colore: string }> = {
  sma20: { nome: "SMA 20", colore: "var(--cat-paypal)" },
  sma50: { nome: "SMA 50", colore: "var(--cat-extra-3)" },
  sma200: { nome: "SMA 200", colore: "var(--cat-bonifici)" },
  ema20: { nome: "EMA 20", colore: "var(--cat-ristoranti)" },
  bollinger: { nome: "Bollinger", colore: "var(--cat-altro)" },
  livelli: { nome: "Livelli", colore: "var(--muted)" },
  trendline: { nome: "Trendline", colore: "var(--accent)" },
  fibonacci: { nome: "Fibonacci", colore: "var(--cat-benzina)" },
  annotazioni: { nome: "Note", colore: "var(--muted)" },
  volumi: { nome: "Volumi", colore: "var(--muted)" },
  rsi: { nome: "RSI", colore: "var(--cat-extra-1)" },
  macd: { nome: "MACD", colore: "var(--cat-extra-4)" },
};

const LARGHEZZA = 360;
const MARGINE_DX = 46;
const MARGINE_SX = 4;
const ALTEZZA_PREZZO = 210;
const ALTEZZA_PANNELLO = 74;
const SPAZIO = 10;

type Disegno =
  | { tipo: "trendline"; a: [number, number]; b: [number, number] }
  | { tipo: "orizzontale"; prezzo: number };

type ModoDisegno = "nessuno" | "trendline" | "orizzontale";

const formatta = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function percorso(serie: Serie, x: (i: number) => number, y: (v: number) => number) {
  let d = "";
  let aperto = false;
  serie.forEach((v, i) => {
    if (v === null) {
      aperto = false;
      return;
    }
    d += `${aperto ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    aperto = true;
  });
  return d;
}

function coloreLivello(tipo: "supporto" | "resistenza" | "neutro") {
  return tipo === "supporto" ? "var(--entrata)" : tipo === "resistenza" ? "var(--spesa)" : "var(--muted)";
}

export function GraficoTrading({
  scenarioId,
  seme,
  strumenti,
  attiviIniziali = [],
  disegno = false,
  didascalia,
}: {
  scenarioId?: string;
  // Solo per il laboratorio: grafico casuale con questo seme.
  seme?: number;
  strumenti: Strumento[];
  attiviIniziali?: Strumento[];
  disegno?: boolean;
  didascalia?: string;
}) {
  const scenario: Scenario = useMemo(
    () => (seme !== undefined ? scenarioCasuale(seme) : SCENARI[scenarioId ?? "rialzo"]),
    [scenarioId, seme],
  );
  const candele: Candela[] = useMemo(() => candeleScenario(scenario), [scenario]);
  const chiusure = useMemo(() => candele.map((c) => c.close), [candele]);

  const [attivi, setAttivi] = useState<Set<Strumento>>(() => new Set(attiviIniziali));
  const [hover, setHover] = useState<number | null>(null);
  const [modo, setModo] = useState<ModoDisegno>("nessuno");
  const [disegni, setDisegni] = useState<Disegno[]>([]);
  const [puntoA, setPuntoA] = useState<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const on = (s: Strumento) => attivi.has(s);
  const cambia = (s: Strumento) =>
    setAttivi((prec) => {
      const n = new Set(prec);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  const ind = useMemo(
    () => ({
      sma20: sma(chiusure, 20),
      sma50: sma(chiusure, 50),
      sma200: sma(chiusure, 200),
      ema20: ema(chiusure, 20),
      boll: bollinger(chiusure, 20, 2),
      rsi: rsi(chiusure, 14),
      macd: macd(chiusure),
    }),
    [chiusure],
  );

  // Pannelli sotto il grafico prezzi.
  const pannelli = (["rsi", "macd"] as const).filter((p) => on(p));
  const altezza = ALTEZZA_PREZZO + pannelli.length * (ALTEZZA_PANNELLO + SPAZIO) + 4;

  const n = candele.length;
  const larghezzaUtile = LARGHEZZA - MARGINE_DX - MARGINE_SX;
  const passo = larghezzaUtile / n;
  const x = (i: number) => MARGINE_SX + i * passo + passo / 2;

  // Scala prezzi su candele + overlay visibili.
  let minimo = Math.min(...candele.map((c) => c.low));
  let massimo = Math.max(...candele.map((c) => c.high));
  if (on("bollinger")) {
    for (const v of ind.boll.alta) if (v !== null) massimo = Math.max(massimo, v);
    for (const v of ind.boll.bassa) if (v !== null) minimo = Math.min(minimo, v);
  }
  if (on("livelli")) for (const l of scenario.livelli ?? []) {
    minimo = Math.min(minimo, l.prezzo);
    massimo = Math.max(massimo, l.prezzo);
  }
  const margine = (massimo - minimo) * 0.06;
  minimo -= margine;
  massimo += margine;
  const altoVolumi = on("volumi") ? 44 : 0;
  const y = (p: number) => 6 + ((massimo - p) / (massimo - minimo)) * (ALTEZZA_PREZZO - 12 - altoVolumi);
  const prezzoDaY = (py: number) => massimo - ((py - 6) / (ALTEZZA_PREZZO - 12 - altoVolumi)) * (massimo - minimo);

  const tacche = Array.from({ length: 5 }, (_, k) => minimo + ((massimo - minimo) * (k + 0.5)) / 5);
  const volMax = Math.max(...candele.map((c) => c.volume));

  // Coordinate del puntatore nel sistema del viewBox.
  function coordinate(e: React.PointerEvent<SVGSVGElement>) {
    const r = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * LARGHEZZA;
    const py = ((e.clientY - r.top) / r.height) * altezza;
    const i = Math.max(0, Math.min(n - 1, Math.round((px - MARGINE_SX - passo / 2) / passo)));
    return { px, py, i };
  }

  function alPuntatore(e: React.PointerEvent<SVGSVGElement>) {
    const { i } = coordinate(e);
    setHover(i);
  }

  function alTocco(e: React.PointerEvent<SVGSVGElement>) {
    const { px, py, i } = coordinate(e);
    if (modo === "nessuno") {
      setHover(i);
      return;
    }
    if (py > ALTEZZA_PREZZO) return;
    const prezzo = prezzoDaY(py);
    if (modo === "orizzontale") {
      setDisegni((d) => [...d, { tipo: "orizzontale", prezzo }]);
      return;
    }
    const indiceFine = (px - MARGINE_SX - passo / 2) / passo;
    if (!puntoA) setPuntoA([indiceFine, prezzo]);
    else {
      setDisegni((d) => [...d, { tipo: "trendline", a: puntoA, b: [indiceFine, prezzo] }]);
      setPuntoA(null);
    }
  }

  // Una trendline si prolunga fino al bordo destro (come in TradingView con "estendi a destra").
  function segmentoEsteso(a: [number, number], b: [number, number]) {
    const [i0, p0] = a[0] <= b[0] ? a : b;
    const [i1, p1] = a[0] <= b[0] ? b : a;
    const pendenza = i1 === i0 ? 0 : (p1 - p0) / (i1 - i0);
    const fine = n - 1;
    return { x1: x(i0), y1: y(p0), x2: x(fine), y2: y(p0 + pendenza * (fine - i0)) };
  }

  const c = hover !== null ? candele[hover] : candele[n - 1];
  const iInfo = hover ?? n - 1;
  const variazione = iInfo > 0 ? ((c.close - candele[iInfo - 1].close) / candele[iInfo - 1].close) * 100 : 0;

  // Fibonacci sul movimento indicato dallo scenario.
  const fib = scenario.fibonacci
    ? ritracciamentiFibonacci(candele[scenario.fibonacci.minimo].low, candele[scenario.fibonacci.massimo].high)
    : [];

  return (
    <figure className="flex flex-col gap-3">
      {/* Riga informazioni candela (tocca o passa sopra il grafico). */}
      <div className="font-figures flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px] text-muted">
        <span className="text-foreground">Candela {iInfo + 1}</span>
        <span>A {formatta(c.open)}</span>
        <span>M {formatta(c.high)}</span>
        <span>m {formatta(c.low)}</span>
        <span>C {formatta(c.close)}</span>
        <span className={variazione >= 0 ? "text-entrata" : "text-spesa"}>
          {variazione >= 0 ? "+" : ""}
          {variazione.toFixed(2)}%
        </span>
        {on("rsi") && ind.rsi[iInfo] !== null && <span>RSI {ind.rsi[iInfo]!.toFixed(0)}</span>}
      </div>

      <div className="overflow-hidden rounded-[var(--app-card-radius)] border border-border bg-background">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LARGHEZZA} ${altezza}`}
          className={`block h-auto w-full select-none ${modo !== "nessuno" ? "cursor-crosshair touch-none" : ""}`}
          role="img"
          aria-label={didascalia ?? scenario.titolo}
          onPointerMove={alPuntatore}
          onPointerLeave={() => setHover(null)}
          onPointerDown={alTocco}
        >
          {/* Griglia e asse prezzi */}
          {tacche.map((t) => (
            <g key={t}>
              <line x1={MARGINE_SX} x2={LARGHEZZA - MARGINE_DX} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={0.5} />
              <text x={LARGHEZZA - MARGINE_DX + 4} y={y(t) + 4} fontSize={12} fill="var(--muted)" className="font-figures">
                {t.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Volumi in basso nel pannello prezzi */}
          {on("volumi") &&
            candele.map((k, i) => {
              const h = (k.volume / volMax) * (altoVolumi - 4);
              return (
                <rect
                  key={`v${i}`}
                  x={x(i) - passo * 0.35}
                  y={ALTEZZA_PREZZO - 6 - h}
                  width={passo * 0.7}
                  height={h}
                  fill={k.close >= k.open ? "var(--entrata)" : "var(--spesa)"}
                  opacity={0.35}
                />
              );
            })}

          {/* Bande di Bollinger */}
          {on("bollinger") && (
            <g fill="none" stroke={ETICHETTE.bollinger.colore} strokeWidth={1}>
              <path d={percorso(ind.boll.alta, x, y)} />
              <path d={percorso(ind.boll.bassa, x, y)} />
              <path d={percorso(ind.boll.media, x, y)} strokeDasharray="3 3" opacity={0.7} />
            </g>
          )}

          {/* Livelli dello scenario */}
          {on("livelli") &&
            (scenario.livelli ?? []).map((l) => (
              <g key={l.etichetta}>
                <line
                  x1={MARGINE_SX}
                  x2={LARGHEZZA - MARGINE_DX}
                  y1={y(l.prezzo)}
                  y2={y(l.prezzo)}
                  stroke={coloreLivello(l.tipo)}
                  strokeWidth={1.2}
                  strokeDasharray="5 3"
                />
                <text x={MARGINE_SX + 4} y={y(l.prezzo) - 4} fontSize={12} fill={coloreLivello(l.tipo)}>
                  {l.etichetta}
                </text>
              </g>
            ))}

          {/* Fibonacci */}
          {on("fibonacci") &&
            fib.map((f) => (
              <g key={f.livello}>
                <line
                  x1={x(scenario.fibonacci!.minimo)}
                  x2={LARGHEZZA - MARGINE_DX}
                  y1={y(f.prezzo)}
                  y2={y(f.prezzo)}
                  stroke={ETICHETTE.fibonacci.colore}
                  strokeWidth={f.livello === 0.618 ? 1.4 : 0.8}
                  opacity={f.livello === 0.618 || f.livello === 0.5 || f.livello === 0.382 ? 1 : 0.55}
                />
                <text x={x(scenario.fibonacci!.massimo) + 4} y={y(f.prezzo) - 3} fontSize={12} fill={ETICHETTE.fibonacci.colore}>
                  {(f.livello * 100).toFixed(1).replace(".0", "")}%
                </text>
              </g>
            ))}

          {/* Candele */}
          {candele.map((k, i) => {
            const su = k.close >= k.open;
            const colore = su ? "var(--entrata)" : "var(--spesa)";
            const corpoAlto = y(Math.max(k.open, k.close));
            const corpo = Math.max(0.8, Math.abs(y(k.open) - y(k.close)));
            return (
              <g key={i}>
                <line x1={x(i)} x2={x(i)} y1={y(k.high)} y2={y(k.low)} stroke={colore} strokeWidth={Math.max(0.6, passo * 0.12)} />
                <rect x={x(i) - passo * 0.33} y={corpoAlto} width={passo * 0.66} height={corpo} fill={colore} />
              </g>
            );
          })}

          {/* Medie mobili */}
          {(["sma20", "sma50", "sma200", "ema20"] as const).map(
            (m) =>
              on(m) && (
                <path key={m} d={percorso(ind[m], x, y)} fill="none" stroke={ETICHETTE[m].colore} strokeWidth={1.6} />
              ),
          )}

          {/* Trendline dello scenario */}
          {on("trendline") &&
            (scenario.trendline ?? []).map((t) => {
              const s = segmentoEsteso(t.da, t.a);
              return (
                <g key={t.etichetta}>
                  <line {...s} stroke={ETICHETTE.trendline.colore} strokeWidth={1.6} />
                  <circle cx={x(t.da[0])} cy={y(t.da[1])} r={3} fill={ETICHETTE.trendline.colore} />
                  <circle cx={x(t.a[0])} cy={y(t.a[1])} r={3} fill={ETICHETTE.trendline.colore} />
                </g>
              );
            })}

          {/* Annotazioni */}
          {on("annotazioni") &&
            (scenario.annotazioni ?? []).map((a) => {
              const k = candele[a.indice];
              const sopra = a.indice > 0 && k.close >= candele[Math.max(0, a.indice - 3)].close;
              const py = sopra ? y(k.high) - 8 : y(k.low) + 16;
              const ancora = x(a.indice) > LARGHEZZA - MARGINE_DX - 60 ? "end" : x(a.indice) < 50 ? "start" : "middle";
              return (
                <text key={a.testo} x={x(a.indice)} y={py} fontSize={12} textAnchor={ancora} fill="var(--foreground)">
                  {a.testo}
                </text>
              );
            })}

          {/* Disegni dell'utente */}
          {disegni.map((d, k) =>
            d.tipo === "orizzontale" ? (
              <g key={k}>
                <line x1={MARGINE_SX} x2={LARGHEZZA - MARGINE_DX} y1={y(d.prezzo)} y2={y(d.prezzo)} stroke="var(--accent)" strokeWidth={1.4} />
                <text x={LARGHEZZA - MARGINE_DX + 4} y={y(d.prezzo) + 4} fontSize={12} fill="var(--accent)" className="font-figures">
                  {d.prezzo.toFixed(1)}
                </text>
              </g>
            ) : (
              <line key={k} {...segmentoEsteso(d.a, d.b)} stroke="var(--accent)" strokeWidth={1.6} />
            ),
          )}
          {puntoA && <circle cx={x(puntoA[0])} cy={y(puntoA[1])} r={4} fill="var(--accent)" />}

          {/* Pannelli indicatori */}
          {pannelli.map((p, k) => {
            const top = ALTEZZA_PREZZO + SPAZIO + k * (ALTEZZA_PANNELLO + SPAZIO);
            const bordo = (
              <rect x={MARGINE_SX} y={top} width={larghezzaUtile} height={ALTEZZA_PANNELLO} fill="none" stroke="var(--border)" strokeWidth={0.5} />
            );
            if (p === "rsi") {
              const yr = (v: number) => top + ((100 - v) / 100) * ALTEZZA_PANNELLO;
              return (
                <g key="rsi">
                  {bordo}
                  <rect x={MARGINE_SX} y={yr(70)} width={larghezzaUtile} height={yr(30) - yr(70)} fill={ETICHETTE.rsi.colore} opacity={0.08} />
                  {[70, 30].map((l) => (
                    <g key={l}>
                      <line x1={MARGINE_SX} x2={LARGHEZZA - MARGINE_DX} y1={yr(l)} y2={yr(l)} stroke="var(--muted)" strokeDasharray="3 3" strokeWidth={0.6} />
                      <text x={LARGHEZZA - MARGINE_DX + 4} y={yr(l) + 4} fontSize={12} fill="var(--muted)">
                        {l}
                      </text>
                    </g>
                  ))}
                  <path d={percorso(ind.rsi, x, yr)} fill="none" stroke={ETICHETTE.rsi.colore} strokeWidth={1.4} />
                  <text x={MARGINE_SX + 4} y={top + 14} fontSize={12} fill="var(--muted)">RSI 14</text>
                </g>
              );
            }
            const valori = [...ind.macd.macd, ...ind.macd.segnale, ...ind.macd.istogramma].filter((v): v is number => v !== null);
            const amp = Math.max(...valori.map(Math.abs), 0.01);
            const ym = (v: number) => top + ALTEZZA_PANNELLO / 2 - (v / amp) * (ALTEZZA_PANNELLO / 2 - 6);
            return (
              <g key="macd">
                {bordo}
                <line x1={MARGINE_SX} x2={LARGHEZZA - MARGINE_DX} y1={ym(0)} y2={ym(0)} stroke="var(--muted)" strokeWidth={0.5} />
                {ind.macd.istogramma.map((v, i) =>
                  v === null ? null : (
                    <rect
                      key={i}
                      x={x(i) - passo * 0.3}
                      y={Math.min(ym(0), ym(v))}
                      width={passo * 0.6}
                      height={Math.abs(ym(v) - ym(0))}
                      fill={v >= 0 ? "var(--entrata)" : "var(--spesa)"}
                      opacity={0.5}
                    />
                  ),
                )}
                <path d={percorso(ind.macd.macd, x, ym)} fill="none" stroke={ETICHETTE.macd.colore} strokeWidth={1.4} />
                <path d={percorso(ind.macd.segnale, x, ym)} fill="none" stroke={ETICHETTE.ema20.colore} strokeWidth={1.2} />
                <text x={MARGINE_SX + 4} y={top + 14} fontSize={12} fill="var(--muted)">MACD 12·26·9</text>
              </g>
            );
          })}

          {/* Crosshair */}
          {hover !== null && modo === "nessuno" && (
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={altezza} stroke="var(--muted)" strokeWidth={0.6} strokeDasharray="2 2" />
          )}
        </svg>
      </div>

      {/* Indicatori attivabili */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Indicatori sul grafico">
        {strumenti.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={on(s)}
            onClick={() => cambia(s)}
            className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors [@media(pointer:coarse)]:min-h-11 ${
              on(s) ? "border-transparent bg-surface-hover text-foreground" : "border-border text-muted"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: on(s) ? ETICHETTE[s].colore : "transparent", border: `1.5px solid ${ETICHETTE[s].colore}` }} />
            {ETICHETTE[s].nome}
          </button>
        ))}
      </div>

      {/* Strumenti di disegno */}
      {disegno && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Strumenti di disegno">
            {(
              [
                { m: "nessuno", nome: "Leggi", icona: MousePointer2 },
                { m: "trendline", nome: "Trendline", icona: TrendingUp },
                { m: "orizzontale", nome: "Livello", icona: Minus },
              ] as const
            ).map(({ m, nome, icona: Icona }) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => {
                  setModo(m);
                  setPuntoA(null);
                }}
                className={`flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-[15px] font-medium ${
                  modo === m ? "bg-accent text-accent-foreground" : "bg-surface-hover text-foreground"
                }`}
              >
                <Icona className="h-4 w-4" />
                {nome}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setDisegni([]);
                setPuntoA(null);
              }}
              disabled={disegni.length === 0 && !puntoA}
              className="flex min-h-11 items-center gap-1.5 rounded-[10px] bg-surface-hover px-3 text-[15px] font-medium text-foreground disabled:opacity-40"
            >
              <Eraser className="h-4 w-4" />
              Cancella
            </button>
          </div>
          <p className="text-[13px] text-muted">
            {modo === "trendline"
              ? puntoA
                ? "Ora tocca il secondo punto: la linea si prolunga verso destra."
                : "Tocca il primo minimo (o massimo) da collegare."
              : modo === "orizzontale"
                ? "Tocca il prezzo dove vuoi segnare un supporto o una resistenza."
                : "Tocca il grafico per leggere i valori di una candela."}
          </p>
        </div>
      )}

      {didascalia && <figcaption className="text-[13px] text-muted">{didascalia}</figcaption>}
    </figure>
  );
}

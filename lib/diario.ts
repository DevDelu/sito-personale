// Diario di bordo pubblico: ultime PR mergiate del repo (pubblico), raggruppate
// per settimana. Solo titolo, data e link: mai corpo, autore o etichette.
// Puro tranne leggiPrMergiate (fetch), così il raggruppamento si testa con node:test.

export type PrPubblica = { numero: number; titolo: string; mergiataIl: string; url: string };
export type SettimanaDiario = { inizio: string; prs: PrPubblica[] };

const REPO = "DevDelu/sito-personale";
const MAX_PR = 30;

// Esclusi: aggiornamenti automatici delle dipendenze e ripristini degli agenti.
const TITOLI_ESCLUSI = [/^build\(deps/i, /^bump /i, /^revert /i];

type RispostaPr = { number: number; title: string; merged_at: string | null; html_url: string };

export function filtraPr(grezze: RispostaPr[], max = MAX_PR): PrPubblica[] {
  return grezze
    .filter((p) => p.merged_at && !TITOLI_ESCLUSI.some((re) => re.test(p.title)))
    .map((p) => ({ numero: p.number, titolo: p.title.trim(), mergiataIl: p.merged_at as string, url: p.html_url }))
    .sort((a, b) => b.mergiataIl.localeCompare(a.mergiataIl))
    .slice(0, max);
}

// Lunedì (UTC) della settimana di una data ISO, come YYYY-MM-DD.
export function lunediDellaSettimana(iso: string): string {
  const d = new Date(iso);
  const giorno = (d.getUTCDay() + 6) % 7; // lun = 0
  d.setUTCDate(d.getUTCDate() - giorno);
  return d.toISOString().slice(0, 10);
}

export function raggruppaPerSettimana(prs: PrPubblica[]): SettimanaDiario[] {
  const gruppi = new Map<string, PrPubblica[]>();
  for (const pr of prs) {
    const chiave = lunediDellaSettimana(pr.mergiataIl);
    gruppi.set(chiave, [...(gruppi.get(chiave) ?? []), pr]);
  }
  return [...gruppi.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([inizio, lista]) => ({ inizio, prs: lista }));
}

// API pubblica di GitHub senza token, rigenerata ogni 6 ore (ISR). Se fallisce a
// runtime lancia, così Next tiene l'ultima versione buona; in build restituisce
// [] per non bloccare il deploy.
export async function leggiPrMergiate(): Promise<PrPubblica[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=80`,
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 21600 } },
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return filtraPr((await res.json()) as RispostaPr[]);
  } catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    throw e;
  }
}

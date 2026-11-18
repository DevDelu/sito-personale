// Da una PR mergiata a una voce della sezione Novità, in parole semplici.
// Pura e testata: la usa la route che riceve le PR dal workflow di deploy.
//
// Fonte preferita: la sezione `## Novità` del corpo della PR, che agenti e
// sessioni Claude scrivono apposta per Lorenzo (vedi CLAUDE.md):
//
//   ## Novità
//   Tipo: funzione            (funzione | correzione | tecnico)
//   Titolo: Totale della settimana nelle spese      (facoltativo)
//   In Spese adesso vedi anche quanto hai speso questa settimana.
//
// In mancanza: la riga "Nota per Lorenzo:" delle PR dei feedback, poi il
// titolo della PR ripulito. Il tipo si deduce dalle etichette.

export const TIPI_NOVITA = ["funzione", "correzione", "tecnico", "annullata"] as const;
export type TipoNovita = (typeof TIPI_NOVITA)[number];

export type PrGrezza = {
  number: number;
  title: string;
  body?: string | null;
  labels?: string[];
};

export type Novita = { tipo: TipoNovita; titolo: string; spiegazione: string };

const MAX_TITOLO = 200;
const MAX_SPIEGAZIONE = 2000;

// "feat(spese): Totale (#12)" → "Totale"
export function pulisciTitolo(titolo: string): string {
  const t = titolo
    .replace(/\s*\(#\d+\)\s*$/, "")
    .replace(/^(feat|fix|chore|refactor|docs|test|perf|style|ci|build)(\([^)]*\))?!?:\s*/i, "")
    .trim();
  return (t.charAt(0).toUpperCase() + t.slice(1)).slice(0, MAX_TITOLO) || "Modifica senza titolo";
}

// Testo della sezione "## Novità" (fino al titolo successivo), o null.
function sezioneNovita(corpo: string): string | null {
  const righe = corpo.split(/\r?\n/);
  const inizio = righe.findIndex((r) => /^#{1,4}\s*novit(à|a)\s*$/i.test(r.trim()));
  if (inizio === -1) return null;
  const resto = righe.slice(inizio + 1);
  const fine = resto.findIndex((r) => /^#{1,4}\s/.test(r.trim()));
  const testo = (fine === -1 ? resto : resto.slice(0, fine)).join("\n").trim();
  return testo || null;
}

function tipoDaEtichette(labels: string[]): TipoNovita | null {
  const l = labels.map((x) => x.toLowerCase());
  if (l.some((x) => ["bug", "dal-collaudo", "dal-tester", "riaperto"].includes(x))) return "correzione";
  if (l.some((x) => ["proposta", "funzione", "enhancement"].includes(x))) return "funzione";
  if (l.some((x) => ["dipendenze", "dependencies", "tecnico", "documentazione"].includes(x))) return "tecnico";
  return null;
}

// Rimuove il Markdown più comune: la spiegazione si mostra come testo.
function testoSemplice(s: string): string {
  return s
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

export function novitaDaPr(pr: PrGrezza): Novita {
  const corpo = pr.body ?? "";
  const labels = pr.labels ?? [];

  // PR di rollback ("Revert "..."" generate da GitHub o dal giro notturno).
  const revert = pr.title.match(/^Revert\s+"?(.+?)"?\s*(\(#\d+\))?$/i);
  if (revert) {
    const sezione = sezioneNovita(corpo);
    return {
      tipo: "annullata",
      titolo: `Annullata: ${pulisciTitolo(revert[1])}`.slice(0, MAX_TITOLO),
      spiegazione: (sezione
        ? testoSemplice(sezione.replace(/^(tipo|titolo):.*$/gim, "").trim())
        : "Questa modifica è stata tolta perché creava problemi: il sito è tornato com'era prima."
      ).slice(0, MAX_SPIEGAZIONE),
    };
  }

  const sezione = sezioneNovita(corpo);
  if (sezione) {
    const tipoRiga = sezione.match(/^tipo:\s*(\S+)/im)?.[1]?.toLowerCase();
    const titoloRiga = sezione.match(/^titolo:\s*(.+)$/im)?.[1]?.trim();
    const spiegazione = testoSemplice(sezione.replace(/^(tipo|titolo):.*$/gim, "").trim());
    const tipo = (TIPI_NOVITA as readonly string[]).includes(tipoRiga ?? "")
      ? (tipoRiga as TipoNovita)
      : (tipoDaEtichette(labels) ?? "funzione");
    return {
      tipo: tipo === "annullata" ? "tecnico" : tipo,
      titolo: titoloRiga ? titoloRiga.slice(0, MAX_TITOLO) : pulisciTitolo(pr.title),
      spiegazione: (spiegazione || pulisciTitolo(pr.title)).slice(0, MAX_SPIEGAZIONE),
    };
  }

  const nota = corpo.match(/^nota per lorenzo:\s*(.+)$/im)?.[1]?.trim();
  const titolo = pulisciTitolo(pr.title);
  return {
    tipo: tipoDaEtichette(labels) ?? (nota ? "correzione" : "tecnico"),
    titolo,
    spiegazione: (nota ? testoSemplice(nota) : titolo).slice(0, MAX_SPIEGAZIONE),
  };
}

// Novità che meritano una notifica: quelle che cambiano qualcosa per Lorenzo.
export function perTe(tipo: TipoNovita): boolean {
  return tipo !== "tecnico";
}

// Testo della notifica per un gruppo di novità appena andate online.
export function testoNotifica(nuove: Pick<Novita, "tipo" | "titolo">[]): { title: string; body: string } | null {
  const rilevanti = nuove.filter((n) => perTe(n.tipo));
  if (rilevanti.length === 0) return null;
  if (rilevanti.length === 1) return { title: "Novità su Radar", body: rilevanti[0].titolo };
  const primi = rilevanti.slice(0, 2).map((n) => n.titolo).join(" · ");
  const altre = rilevanti.length - 2;
  return {
    title: `${rilevanti.length} novità su Radar`,
    body: altre > 0 ? `${primi} e altre ${altre}` : primi,
  };
}

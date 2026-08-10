import type { RawTransaction } from "@/lib/parsers/raw-crypto";

export type CategorizationRule = {
  id: string;
  descrizione: string; // commento umano, per manutenzione futura
  match: (raw: RawTransaction) => boolean;
  escludi?: true; // giroconto: riga scartata, non inserita
  categoria?: string; // richiesto se !escludi, deve esistere in `categorie` per il tipo giusto
  titolo: (raw: RawTransaction) => string;
  estraiNominativo?: (raw: RawTransaction) => string | null;
  estraiDettaglio?: (raw: RawTransaction) => string | null;
};

// Nome usato per riconoscere i bonifici da/verso sé stesso (giroconti Intesa
// verso il proprio altro conto), da tenere allineato al titolare reale.
export const PROPRIO_NOMINATIVO = "Lorenzo De Luca";

function testoCompleto(raw: RawTransaction): string {
  return `${raw.descrizioneGrezza} ${raw.dettagliGrezzi}`;
}

function contiene(raw: RawTransaction, ...termini: string[]): boolean {
  const testo = testoCompleto(raw).toLowerCase();
  return termini.some((t) => testo.includes(t.toLowerCase()));
}

function isBonificoVersoSeStesso(raw: RawTransaction): boolean {
  const testo = testoCompleto(raw).toLowerCase();
  const nome = PROPRIO_NOMINATIVO.toLowerCase();
  return testo.includes("da voi disposto") && testo.includes(`a favore di ${nome}`);
}

// Per una spesa (bonifico disposto da me) il nominativo interessante è il
// beneficiario ("a favore di X"); per un'entrata (bonifico ricevuto) è il
// mittente ("disposto da X" / "da X"). Controllare prima il pattern giusto
// per il verso evita di estrarre il proprio nome come nominativo.
// Il nome catturato si ferma a virgola/a-capo oppure all'inizio della
// clausola opposta ("a favore di"/"disposto da"), che negli export banca a
// volte compaiono di seguito senza un separatore tra loro.
const FINE_NOME = /(?:,|\n|\ba favore di\b|\bdisposto da\b|$)/i;

function estraiNominativoBonifico(raw: RawTransaction): string | null {
  const testo = testoCompleto(raw);
  const favoreMatch = testo.match(new RegExp(`a favore di\\s+(.+?)${FINE_NOME.source}`, "i"));
  const dispostoMatch = testo.match(new RegExp(`disposto da\\s+(.+?)${FINE_NOME.source}`, "i"));

  if (raw.tipo === "spesa") {
    if (favoreMatch) return favoreMatch[1].trim();
    if (dispostoMatch) return dispostoMatch[1].trim();
  } else {
    if (dispostoMatch) return dispostoMatch[1].trim();
    if (favoreMatch) return favoreMatch[1].trim();
  }
  return null;
}

// Mittente di un accredito stipendio: es. "Accredito Stipendio mensile da
// ACME SRL" -> "ACME SRL". Pattern più permissivo di estraiNominativoBonifico
// perché l'export banca non usa sempre "disposto da" per gli stipendi.
function estraiNominativoStipendio(raw: RawTransaction): string | null {
  const conNominativo = estraiNominativoBonifico(raw);
  if (conNominativo) return conNominativo;
  const testo = testoCompleto(raw);
  const daMatch = testo.match(/\bda\s+([^,\n]+)$/i);
  if (daMatch) return daMatch[1].trim();
  return null;
}

export const REGOLE: CategorizationRule[] = [
  {
    id: "crypto-deposit-withdrawal",
    descrizione: "Movimenti di giroconto tra wallet EUR e conto bancario, non spese/entrate reali.",
    match: (raw) =>
      raw.fonte === "crypto" &&
      (raw.descrizioneGrezza.toLowerCase().startsWith("eur deposit") ||
        raw.descrizioneGrezza.toLowerCase().startsWith("eur withdrawal")),
    escludi: true,
    titolo: () => "",
  },
  {
    id: "intesa-bonifico-self",
    descrizione: "Bonifico disposto da me a favore di me stesso (giroconto tra conti propri).",
    match: (raw) => raw.fonte === "intesa" && isBonificoVersoSeStesso(raw),
    escludi: true,
    titolo: () => "",
  },
  {
    id: "ristoranti-merchant",
    descrizione: "Merchant di ristorazione riconosciuti (Pellegrini, Bkno, McDonald's).",
    match: (raw) =>
      raw.tipo === "spesa" && contiene(raw, "Pellegrini Spa", "Bkno Spa", "Mc Donald's", "McDonald's"),
    categoria: "Ristoranti",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
  },
  {
    id: "benzina-eni",
    descrizione: 'Stazioni Eni (descrizione tipo "Eni1234").',
    match: (raw) => raw.tipo === "spesa" && /^eni\d+/i.test(raw.descrizioneGrezza.trim()),
    categoria: "Benzina",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
  },
  {
    id: "alimentari-supermercati",
    descrizione: "Catene di supermercati riconosciute.",
    match: (raw) =>
      raw.tipo === "spesa" &&
      contiene(raw, "Supermercato", "Coop", "Conad", "Esselunga", "Carrefour", "Lidl"),
    categoria: "Alimentari",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
  },
  {
    id: "paypal",
    descrizione: "Addebiti PayPal, sia da Crypto.com che SDD Intesa.",
    match: (raw) => raw.tipo === "spesa" && contiene(raw, "PayPal"),
    categoria: "PayPal",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
  },
  {
    id: "vinted",
    descrizione: "Acquisti/vendite Vinted (MGP*Vinted su Crypto, Vinted su Intesa).",
    match: (raw) => contiene(raw, "MGP*Vinted", "Vinted"),
    categoria: "Vinted",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
  },
  {
    id: "intesa-bonifici",
    descrizione: "Bonifici Intesa non verso/da sé stesso: estrae il nominativo dal testo.",
    match: (raw) =>
      raw.fonte === "intesa" &&
      raw.descrizioneGrezza.trim().toLowerCase().startsWith("bonifico") &&
      !isBonificoVersoSeStesso(raw),
    categoria: "Bonifici",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
    estraiNominativo: estraiNominativoBonifico,
  },
  {
    id: "stipendio",
    descrizione: 'Accrediti stipendio (Operazione contiene "Stipendio" o categoria banca "Stipendi").',
    match: (raw) =>
      raw.tipo === "entrata" &&
      raw.fonte === "intesa" &&
      (raw.descrizioneGrezza.toLowerCase().includes("stipendio") ||
        (raw.categoriaBanca ?? "").toLowerCase() === "stipendi"),
    categoria: "Stipendio",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
    estraiNominativo: estraiNominativoStipendio,
  },
  {
    id: "default-altro",
    descrizione: 'Nessuna regola precedente ha matchato: finisce in "Altro", da verificare manualmente.',
    match: () => true,
    categoria: "Altro",
    titolo: (raw) => raw.descrizioneGrezza.trim(),
  },
];

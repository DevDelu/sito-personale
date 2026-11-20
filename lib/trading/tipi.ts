// Tipi del contenuto della Scuola (lezioni, blocchi, quiz). Testo in
// blocchi tipizzati, niente MDX: ogni blocco grafico è interattivo e
// configurato nei file lezioni-*.ts. `**grassetto**` è l'unica
// formattazione ammessa nel testo.

import type { Strumento } from "@/components/trading/GraficoTrading";

export type Blocco =
  | { tipo: "testo"; testo: string }
  | { tipo: "punti"; titolo?: string; voci: string[] }
  | { tipo: "grafico"; scenario: string; strumenti: Strumento[]; attivi?: Strumento[]; disegno?: boolean; didascalia: string }
  | { tipo: "anatomia" }
  | { tipo: "pattern-candele" }
  | { tipo: "calcolatore" }
  | { tipo: "schema"; nome: "curva-rendimenti" | "ciclo-settori" }
  | { tipo: "tabella"; titolo?: string; intestazioni: string[]; righe: string[][] }
  // Frasi del gergo con il loro significato e un esempio d'uso.
  | { tipo: "frasi"; titolo?: string; voci: { frase: string; significato: string; esempio?: string }[] }
  | { tipo: "nvda"; testo: string }
  | { tipo: "pratica"; testo: string }
  | { tipo: "attenzione"; testo: string };

export type Domanda = { domanda: string; opzioni: string[]; corretta: number; spiegazione: string };

export type ModuloId =
  | "mercati"
  | "aziende"
  | "macro"
  | "tecnica-base"
  | "tecnica-indicatori"
  | "tecnica-operativa"
  | "strumenti"
  | "linguaggio";

export type Lezione = {
  slug: string;
  modulo: ModuloId;
  titolo: string;
  sottotitolo: string;
  minuti: number;
  blocchi: Blocco[];
  quiz: Domanda[];
};

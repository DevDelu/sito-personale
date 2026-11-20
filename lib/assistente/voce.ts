// Testi per la sintesi vocale e trascrizioni da scartare. Pure, testate.

// Frasi che Whisper "sente" nel silenzio o nel rumore (allucinazioni note,
// soprattutto in italiano, imparate dai sottotitoli dei video).
const ALLUCINAZIONI = [
  /sottotitoli (creati|a cura|e revisione)/i,
  /amara\.org/i,
  /^grazie (a tutti )?per (la visione|l'attenzione|aver guardato)[.!]?$/i,
  /^(grazie|ciao|buongiorno)[.!]?$/i,
  /^\W*$/,
];

export function trascrizioneValida(testo: string): boolean {
  const t = testo.trim();
  if (t.length < 2) return false;
  return !ALLUCINAZIONI.some((re) => re.test(t));
}

// Ripulisce la risposta prima di leggerla ad alta voce: niente emoji,
// simboli Markdown o trattini da elenco, che le voci di sistema leggono
// male ("asterisco", "trattino").
export function perVoce(testo: string): string {
  return testo
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[*_#`>]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/€\s?(\d[\d.,]*\d|\d)/g, "$1 euro")
    .replace(/(\d)\s?€/g, "$1 euro")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\.(\s*\.)+/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Chrome interrompe le sintesi più lunghe di ~15 s: si legge una frase alla
// volta. Le frasi brevissime si accorpano alla precedente per non spezzare
// il ritmo.
export function frasiPerVoce(testo: string): string[] {
  const pulito = perVoce(testo);
  if (!pulito) return [];
  const pezzi = pulito.match(/[^.!?;]+[.!?;]*/g) ?? [pulito];
  const frasi: string[] = [];
  for (const p of pezzi.map((x) => x.trim()).filter(Boolean)) {
    if (frasi.length && p.length < 25) frasi[frasi.length - 1] += ` ${p}`;
    else frasi.push(p);
  }
  return frasi;
}

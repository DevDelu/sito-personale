// Spezza un testo in parti di al massimo `max` caratteri, preferendo gli
// spazi come punto di taglio. Serve quando il database ha ancora i limiti
// vecchi (prima della migration 034): meglio un feedback in più parti che
// un feedback perso. Nessun import con alias: usata anche dai test node:test.
export function spezzaTesto(testo: string, max: number): string[] {
  const parti: string[] = [];
  let resto = testo.trim();
  while (resto.length > max) {
    const spazio = resto.lastIndexOf(" ", max);
    const taglio = spazio > max / 2 ? spazio : max;
    parti.push(resto.slice(0, taglio).trim());
    resto = resto.slice(taglio).trim();
  }
  if (resto) parti.push(resto);
  return parti;
}

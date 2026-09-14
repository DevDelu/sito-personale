// Scorciatoia opzionale per la creazione inline di un alimento (vedi
// AlimentoSelector/BarcodeScanner): interroga Open Food Facts (API pubblica,
// gratuita, nessuna chiave) e precompila il form manuale — mai un
// salvataggio automatico, l'utente verifica/conferma sempre prima di
// salvare nel catalogo. Nessuna cache locale, nessuna dipendenza critica:
// qualsiasi fallimento (rete, prodotto non trovato) torna null e il flusso
// ricade sul form manuale esistente.
//
// Chiamata client-side (fetch dal browser di chi usa il sito, non dal
// server Next.js) — nessun problema di CORS, Open Food Facts lo consente.

export type ProdottoOpenFoodFacts = {
  nome: string;
  kcal100g: number;
  proteine100g: number;
  carboidrati100g: number;
  grassi100g: number;
};

function numeroOrZero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function cercaProdottoDaBarcode(barcode: string): Promise<ProdottoOpenFoodFacts | null> {
  const codice = barcode.trim();
  if (!codice) return null;

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codice)}.json`);
    if (!res.ok) return null;

    const json = await res.json();
    if (json?.status !== 1 || !json?.product) return null;

    const p = json.product;
    const nutrienti = p.nutriments ?? {};
    const nome: string = p.product_name || p.product_name_it || p.generic_name || "";
    if (!nome) return null;

    // Valori per 100g: Open Food Facts espone sempre "*_100g" quando
    // disponibile (kcal già convertita da kJ se necessario dal loro lato).
    return {
      nome,
      kcal100g: numeroOrZero(nutrienti["energy-kcal_100g"]),
      proteine100g: numeroOrZero(nutrienti["proteins_100g"]),
      carboidrati100g: numeroOrZero(nutrienti["carbohydrates_100g"]),
      grassi100g: numeroOrZero(nutrienti["fat_100g"]),
    };
  } catch {
    // Nessun errore bloccante: OFF è un aiuto opzionale, non una dipendenza
    // critica del modulo (vedi commento in cima al file).
    return null;
  }
}

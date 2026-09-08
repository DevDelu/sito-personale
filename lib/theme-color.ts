// Aggiorna i tag <meta name="theme-color"> con il colore di sfondo
// realmente in uso (letto dal DOM, non un valore fisso duplicato altrove):
// così l'area di sistema del browser (dietro notch/Dynamic Island, la
// fascia rivelata dal rubber-band scroll) combacia sempre con lo sfondo
// della pagina, sia sul sito pubblico (.site-public ha una palette diversa
// dalla dashboard privata) sia dopo un cambio di tema manuale.
export function syncThemeColorMeta() {
  if (typeof document === "undefined") return;
  const scope = document.querySelector<HTMLElement>(".site-public") ?? document.body;
  const color = getComputedStyle(scope).backgroundColor;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
}

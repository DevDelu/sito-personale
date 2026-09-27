import { test, expect, type Page } from "@playwright/test";

// Ogni pagina privata, aperta dal tester in sola lettura su un iPhone
// (390×844). Solo asserzioni strutturali: mai su importi o contenuti, che
// sono dati reali.
const PAGINE = [
  "/spese",
  "/spese/gestione",
  "/spese/importa",
  "/spese/nuovo",
  "/investimenti",
  "/investimenti/gestione",
  "/investimenti/importa",
  "/carte",
  "/carte/nuova",
  "/allenamenti",
  "/allenamenti/schede",
  "/allenamenti/storico",
  "/agenda",
  "/alimentazione",
  "/alimentazione/gestione",
  "/alimentazione/template",
  "/alimentazione/aggiungi",
  "/alimentazione/profilo",
  "/impostazioni",
  "/altro",
];

// Gli errori di rete si giudicano dalle risposte (che hanno l'URL), non dai
// messaggi "Failed to load resource" della console (che non lo hanno).
// Rumore atteso, non un difetto dell'app: 401/403 sulle rotte vietate al
// tester in sola lettura, script Vercel assenti fuori dalla piattaforma.
const CONSOLE_IGNORATA = [/^Failed to load resource/, /_vercel\//];

function osservaErrori(page: Page) {
  const errori: string[] = [];
  page.on("pageerror", (e) => errori.push(`JS: ${e.message.slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const testo = m.text();
    if (!CONSOLE_IGNORATA.some((re) => re.test(testo))) errori.push(`console: ${testo.slice(0, 200)}`);
  });
  page.on("response", (r) => {
    const url = new URL(r.url());
    if (url.origin !== new URL(page.url()).origin || url.pathname.startsWith("/_vercel/")) return;
    if (r.status() >= 500 || r.status() === 404) errori.push(`HTTP ${r.status()} ${url.pathname}`);
  });
  return errori;
}

for (const percorso of PAGINE) {
  test(`${percorso} si apre ed è usabile su iPhone`, async ({ page }) => {
    const errori = osservaErrori(page);

    const risposta = await page.goto(percorso, { waitUntil: "domcontentloaded" });
    expect(risposta?.status(), "status HTTP").toBeLessThan(400);
    expect(new URL(page.url()).pathname, "non deve rimandare al login").not.toBe("/login");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Barra superiore (PageHeader) e tab bar presenti.
    await expect(page.locator(".app-page-header").first(), "PageHeader").toBeVisible();
    const tabBar = page.getByRole("navigation", { name: "Navigazione principale" });
    await expect(tabBar, "tab bar").toBeVisible();

    // Nessuno scroll orizzontale.
    const larghezze = await page.evaluate(() => ({
      pagina: document.documentElement.scrollWidth,
      schermo: window.innerWidth,
    }));
    expect(larghezze.pagina, "scroll orizzontale").toBeLessThanOrEqual(larghezze.schermo + 1);

    // Tap target della tab bar: almeno 44×44 (linee guida iOS).
    for (const box of await tabBar.locator("a, button").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), nome: el.getAttribute("aria-label") ?? el.textContent };
      })
    )) {
      expect(Math.min(box.w, box.h), `tap target "${box.nome}"`).toBeGreaterThanOrEqual(44);
    }

    // Nessun testo sotto i 12px fuori dalla tab bar (regola di CLAUDE.md).
    const testiPiccoli = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Navigazione principale"]');
      const trovati: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const nodo = walker.currentNode;
        const el = nodo.parentElement;
        if (!el || !nodo.textContent?.trim() || nav?.contains(el) || el.closest("svg")) continue;
        const r = el.getBoundingClientRect();
        const stile = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || stile.visibility === "hidden") continue;
        const px = parseFloat(stile.fontSize);
        // Solo il nome del tag e la dimensione: il testo è un dato reale.
        if (px < 12) trovati.push(`<${el.tagName.toLowerCase()} class="${el.className.toString().slice(0, 60)}"> ${px}px`);
      }
      return [...new Set(trovati)].slice(0, 5);
    });
    expect(testiPiccoli, "testo sotto i 12px").toEqual([]);

    expect(errori, "errori JS, console, 404 o 5xx").toEqual([]);
  });
}

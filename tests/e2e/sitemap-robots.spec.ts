import { test, expect } from "@playwright/test";

// /sitemap.xml e /robots.txt devono uscire dal matcher di proxy.ts: se finiscono
// nel routing next-intl rispondono 404 e i motori di ricerca non li vedono.
test.use({ storageState: { cookies: [], origins: [] } });

test("sitemap.xml elenca home IT ed EN e nessuna rotta privata", async ({ request }) => {
  const risposta = await request.get("/sitemap.xml");
  expect(risposta.status()).toBe(200);
  const xml = await risposta.text();
  expect(xml).toContain("/en</loc>");
  expect(xml).not.toMatch(/\/(spese|investimenti|login|api)/);
});

test("robots.txt vieta l'area privata e indica la sitemap", async ({ request }) => {
  const risposta = await request.get("/robots.txt");
  expect(risposta.status()).toBe(200);
  const testo = await risposta.text();
  expect(testo).toContain("Disallow: /spese");
  expect(testo).toContain("Sitemap:");
});

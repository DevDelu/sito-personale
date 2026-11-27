import { test, expect } from "@playwright/test";

// Il recupero password vive fuori da app/[locale]/: se manca in
// UNLOCALIZED_EXACT_ROUTES (proxy.ts) next-intl risponde 404 e chi ha
// dimenticato la password resta chiuso fuori. Si prova da visitatore, senza la
// sessione del tester.
test.use({ storageState: { cookies: [], origins: [] } });

for (const percorso of ["/login", "/login/recupera-password", "/reset-password"]) {
  test(`${percorso} non risponde 404`, async ({ request }) => {
    const risposta = await request.get(percorso, { maxRedirects: 0 });
    expect(risposta.status(), percorso).not.toBe(404);
  });
}

test("/auth/callback senza codice non risponde 404", async ({ request }) => {
  const risposta = await request.get("/auth/callback", { maxRedirects: 0 });
  expect(risposta.status()).not.toBe(404);
});

// Su telefono i link del recupero password erano alti 20px.
for (const [percorso, nome] of [
  ["/login", "Password dimenticata?"],
  ["/login/recupera-password", "Torna al login"],
] as const) {
  test(`${percorso}: il link "${nome}" è alto almeno 44px`, async ({ page }) => {
    await page.goto(percorso);
    const box = await page.getByRole("link", { name: nome }).boundingBox();
    expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  });
}

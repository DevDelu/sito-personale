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

// Arrivando sul recupero password dal link, il controllo anti-spam va ridisegnato
// (il disegno automatico di Turnstile avviene solo al primo caricamento).
// La finta Turnstile disegna solo quando le viene chiesto con render().
test("dal link 'Password dimenticata?' il controllo anti-spam compare", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/**", (rotta) =>
    rotta.fulfill({
      contentType: "application/javascript",
      body: 'window.turnstile={render:(el)=>{const s=document.createElement("span");s.dataset.testid="antispam-finto";s.textContent="ok";el.append(s);return "w"},reset(){},remove(){}};',
    }),
  );
  await page.goto("/login");
  await expect(page.getByTestId("antispam-finto")).toHaveCount(1);
  await page.getByRole("link", { name: "Password dimenticata?" }).click();
  await page.waitForURL("**/login/recupera-password");
  await expect(page.getByTestId("antispam-finto")).toHaveCount(1);
});

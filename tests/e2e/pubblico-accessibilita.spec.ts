import { test, expect } from "@playwright/test";

// Struttura accessibile delle pagine pubbliche (regressioni di #279/#282):
// un solo <main> per pagina, un solo h1, link "Vai al contenuto" che punta al <main>.
test.use({ storageState: { cookies: [], origins: [] } });

for (const percorso of ["/", "/en", "/progetti"]) {
  test(`${percorso} ha un solo main, un solo h1 e il link al contenuto`, async ({ page }) => {
    await page.goto(percorso);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1:not([aria-hidden])")).toHaveCount(1);
    const salto = page.locator('a[href="#contenuto"]');
    await expect(salto).toHaveCount(1);
    await expect(page.locator("main#contenuto")).toHaveCount(1);
  });
}

test("/progetti: i titoli delle card sono h2 sotto l'h1", async ({ page }) => {
  await page.goto("/progetti");
  await expect(page.locator("main h3")).toHaveCount(0);
  expect(await page.locator("main h2").count()).toBeGreaterThan(0);
});

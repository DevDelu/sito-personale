import { test, expect } from "@playwright/test";

// Pressione lunga sulla tab attiva → sheet di feedback con focus sul campo;
// Annulla lo chiude senza lasciare la pagina bloccata. Niente invio: il
// tester è in sola lettura.
test("pressione lunga sulla tab attiva apre il feedback e Annulla lo chiude", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("radar.feedback.scopertaVista", "true");
    } catch {}
  });
  await page.goto("/spese");
  const tab = page.getByRole("navigation", { name: "Navigazione principale" }).locator('a[aria-current="page"]');
  await expect(tab).toBeVisible();

  const box = (await tab.boundingBox())!;
  const punto = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [punto] });
  await page.waitForTimeout(700);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await expect(page.getByRole("heading", { name: "Feedback" })).toBeVisible();
  await expect(page.locator("textarea")).toBeFocused();
  expect(new URL(page.url()).pathname, "la pressione lunga non deve navigare").toBe("/spese");

  await page.getByRole("button", { name: "Annulla" }).click();
  await expect(page.getByRole("heading", { name: "Feedback" })).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("tap normale su un'altra tab cambia sezione", async ({ page }) => {
  await page.goto("/spese");
  await page.getByRole("navigation", { name: "Navigazione principale" }).getByRole("link", { name: "Agenda" }).tap();
  await expect(page).toHaveURL(/\/agenda$/);
});

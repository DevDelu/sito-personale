import { defineConfig } from "@playwright/test";
import { STORAGE_STATE } from "./tests/e2e/login-tester";

// Collaudatore (tests/e2e/): controlli strutturali deterministici sull'area
// privata vista da un iPhone, con l'utente tester in sola lettura. Gira sul
// sito vero (produzione di notte, anteprima Vercel a ogni PR) quindi
// vede dati reali: niente screenshot, video o trace, perché i report delle
// Actions di un repo pubblico sono leggibili da chiunque.
const bypass = process.env.VERCEL_BYPASS_SECRET;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/login-tester.ts",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    storageState: STORAGE_STATE,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "it-IT",
    timezoneId: "Europe/Rome",
    screenshot: "off",
    video: "off",
    trace: "off",
    // Anteprime Vercel protette: "Protection Bypass for Automation".
    extraHTTPHeaders: bypass
      ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "samesitenone" }
      : undefined,
    // Solo per provarlo fuori dalla CI con un Chromium già installato.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [{ name: "iphone" }],
});

#!/usr/bin/env node
// Screenshot per la newsletter degli agenti (vedi .claude/skills/giro-notturno).
//
//   node scripts/screenshot.mjs --base https://sito --out <cartella> /percorso [/altro ...]
//
// Per ogni percorso salva <slug>-mobile.jpg (390×844) e <slug>-desktop.jpg
// (1440×900). Le pagine private si vedono solo se ci sono le variabili del
// tester in sola lettura (TESTER_EMAIL, TESTER_PASSWORD, SUPABASE_URL,
// SUPABASE_ANON_KEY): login come tests/e2e/login-tester.ts, senza il form.
//
// Mostrano DATI REALI: la cartella di uscita deve stare fuori dal repo
// (scratchpad) e le immagini vanno solo nell'email privata a Lorenzo, mai in
// issue, PR, commit o artifact delle Actions.
import { chromium } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

function argomenti(argv) {
  const opz = { base: process.env.RADAR_URL, out: null, percorsi: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") opz.base = argv[++i];
    else if (argv[i] === "--out") opz.out = argv[++i];
    else opz.percorsi.push(argv[i]);
  }
  return opz;
}

async function cookieTester(base) {
  const { TESTER_EMAIL, TESTER_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!TESTER_EMAIL || !TESTER_PASSWORD || !SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const cookie = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookie,
      setAll: (daImpostare) => {
        for (const { name, value } of daImpostare) {
          const i = cookie.findIndex((c) => c.name === name);
          if (i >= 0) cookie.splice(i, 1);
          if (value) cookie.push({ name, value });
        }
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email: TESTER_EMAIL, password: TESTER_PASSWORD });
  if (error) {
    console.error("Login tester fallito: solo pagine pubbliche.");
    return [];
  }
  const { hostname, protocol } = new URL(base);
  return cookie.map(({ name, value }) => ({
    name,
    value,
    domain: hostname,
    path: "/",
    httpOnly: false,
    secure: protocol === "https:",
    sameSite: "Lax",
  }));
}

const VISTE = [
  { nome: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nome: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

async function main() {
  const { base, out, percorsi } = argomenti(process.argv.slice(2));
  if (!base || !out || percorsi.length === 0) {
    console.error("Uso: node scripts/screenshot.mjs --base <url> --out <cartella> /percorso [...]");
    process.exit(2);
  }
  const cartella = resolve(out);
  if (cartella.startsWith(resolve("."))) {
    console.error("La cartella di uscita deve stare fuori dal repo (dati reali).");
    process.exit(2);
  }
  mkdirSync(cartella, { recursive: true });

  const bypass = process.env.VERCEL_BYPASS_SECRET;
  const cookie = await cookieTester(base);
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
  );
  try {
    for (const vista of VISTE) {
      const contesto = await browser.newContext({
        ...vista,
        locale: "it-IT",
        timezoneId: "Europe/Rome",
        colorScheme: "dark",
        extraHTTPHeaders: bypass
          ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "samesitenone" }
          : undefined,
      });
      if (cookie.length) await contesto.addCookies(cookie);
      const pagina = await contesto.newPage();
      for (const percorso of percorsi) {
        const slug = percorso.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "home";
        const file = join(cartella, `${slug}-${vista.nome}.jpg`);
        try {
          await pagina.goto(new URL(percorso, base).toString(), { waitUntil: "networkidle", timeout: 30_000 });
          await pagina.waitForTimeout(800);
          await pagina.screenshot({ path: file, type: "jpeg", quality: 70 });
          console.log(file);
        } catch (e) {
          console.error(`${percorso} (${vista.nome}): ${e.message.split("\n")[0]}`);
        }
      }
      await contesto.close();
    }
  } finally {
    await browser.close();
  }
}

main();

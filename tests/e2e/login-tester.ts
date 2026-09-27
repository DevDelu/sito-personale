import { createServerClient } from "@supabase/ssr";
import type { FullConfig } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";

// globalSetup: sessione dell'utente tester (sola lettura, vedi CLAUDE.md >
// "Tester in sola lettura") senza passare dal form di /login, che ha
// Turnstile anti-bot. Usa lo stesso client @supabase/ssr del sito, così i
// cookie (nome, formato base64, eventuali chunk) sono identici a quelli che
// il proxy si aspetta.
export const STORAGE_STATE = "tests/e2e/.auth/tester.json";

function richiedi(nome: string): string {
  const valore = process.env[nome];
  if (!valore) throw new Error(`Variabile ${nome} mancante (vedi tests/e2e/README.md).`);
  return valore;
}

export default async function loginTester(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error("baseURL mancante: imposta E2E_BASE_URL.");

  const cookie: { name: string; value: string }[] = [];
  const supabase = createServerClient(richiedi("SUPABASE_URL"), richiedi("SUPABASE_ANON_KEY"), {
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

  const { error } = await supabase.auth.signInWithPassword({
    email: richiedi("TESTER_EMAIL"),
    password: richiedi("TESTER_PASSWORD"),
  });
  if (error) throw new Error(`Login tester fallito: ${error.message}`);

  const { hostname, protocol } = new URL(baseURL);
  mkdirSync("tests/e2e/.auth", { recursive: true });
  writeFileSync(
    STORAGE_STATE,
    JSON.stringify({
      cookies: cookie.map(({ name, value }) => ({
        name,
        value,
        domain: hostname,
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 3600,
        httpOnly: false,
        secure: protocol === "https:",
        sameSite: "Lax" as const,
      })),
      origins: [],
    })
  );
}

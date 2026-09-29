import { test } from "node:test";
import assert from "node:assert/strict";
import { classificaErrore } from "./diagnosi-claude.mjs";

test("categorie senza mai riportare il testo", () => {
  assert.match(classificaErrore("Invalid API key · Please run /login", 1), /autenticazione/);
  assert.match(classificaErrore("OAuth token has expired", 1), /autenticazione/);
  assert.match(classificaErrore("Claude AI usage limit reached", 1), /limite di utilizzo/);
  assert.match(classificaErrore("Error: Reached max turns (40)", 1), /turni/);
  const ignoto = classificaErrore("Lorenzo ha speso 34,90 € da Esselunga", 2);
  assert.equal(ignoto, "errore non riconosciuto (codice di uscita 2)");
});

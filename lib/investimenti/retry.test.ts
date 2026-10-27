import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchConRetry } from "./retry.ts";

const senzaAttesa = async () => {};

test("429 poi 200: riprova e riesce", async () => {
  const risposte = [new Response("", { status: 429 }), new Response("ok", { status: 200 })];
  let chiamate = 0;
  const res = await fetchConRetry(async () => risposte[chiamate++], { attesa: senzaAttesa });
  assert.equal(res.status, 200);
  assert.equal(chiamate, 2);
});

test("errore 404: nessun nuovo tentativo", async () => {
  let chiamate = 0;
  const res = await fetchConRetry(async () => (chiamate++, new Response("", { status: 404 })), { attesa: senzaAttesa });
  assert.equal(res.status, 404);
  assert.equal(chiamate, 1);
});

test("429 sempre: dopo i tentativi restituisce l'ultima risposta", async () => {
  let chiamate = 0;
  const res = await fetchConRetry(async () => (chiamate++, new Response("", { status: 429 })), { attesa: senzaAttesa });
  assert.equal(res.status, 429);
  assert.equal(chiamate, 3);
});

test("errore di rete poi ok", async () => {
  let chiamate = 0;
  const res = await fetchConRetry(
    async () => {
      if (chiamate++ === 0) throw new Error("rete");
      return new Response("ok");
    },
    { attesa: senzaAttesa }
  );
  assert.equal(res.status, 200);
});

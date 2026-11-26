import { test } from "node:test";
import assert from "node:assert/strict";
import { RIGHE_PER_PAGINA, tutteLeRighe } from "./tutte-le-righe.ts";

// Finto PostgREST: come quello vero, non dà mai più di 1000 righe per richiesta.
function tabella(quante: number) {
  const righe = Array.from({ length: quante }, (_, i) => i);
  const chiamate: [number, number][] = [];
  return {
    chiamate,
    leggi: async (da: number, a: number) => {
      chiamate.push([da, a]);
      return { data: righe.slice(da, Math.min(a + 1, da + 1000)), error: null };
    },
  };
}

for (const quante of [0, 1, RIGHE_PER_PAGINA - 1, RIGHE_PER_PAGINA, RIGHE_PER_PAGINA + 1, 2500]) {
  test(`legge tutte le ${quante} righe, senza doppioni`, async () => {
    const t = tabella(quante);
    const righe = await tutteLeRighe(t.leggi);
    assert.deepEqual(righe, Array.from({ length: quante }, (_, i) => i));
    assert.equal(t.chiamate.length, Math.floor(quante / RIGHE_PER_PAGINA) + 1);
  });
}

test("un errore su una pagina successiva non restituisce dati parziali", async () => {
  await assert.rejects(
    tutteLeRighe<number>(async (da) =>
      da === 0 ? { data: Array(RIGHE_PER_PAGINA).fill(1), error: null } : { data: null, error: { message: "boom" } }
    ),
    /boom/
  );
});

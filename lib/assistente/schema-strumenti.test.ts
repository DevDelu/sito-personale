import { test } from "node:test";
import assert from "node:assert/strict";
import { opzionaliNullabili } from "./schema-strumenti.ts";

const def = {
  type: "function" as const,
  function: {
    name: "x",
    description: "d",
    parameters: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["a", "b"] },
        testo: { type: "string" },
        pagina: { type: "string" },
        opz: { type: "string", enum: ["a"] },
      },
      required: ["tipo", "testo"],
    },
  },
};

test("i parametri opzionali accettano null, gli obbligatori no", () => {
  const [r] = opzionaliNullabili([def]);
  const p = (r.function.parameters as { properties: Record<string, { type: unknown; enum?: unknown[] }> }).properties;
  assert.equal(p.tipo.type, "string");
  assert.equal(p.testo.type, "string");
  assert.deepEqual(p.pagina.type, ["string", "null"]);
  assert.deepEqual(p.opz.enum, ["a", null]);
});

test("non modifica l'originale", () => {
  opzionaliNullabili([def]);
  assert.equal((def.function.parameters.properties.pagina as { type: unknown }).type, "string");
});

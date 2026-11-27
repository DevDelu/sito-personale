import { test } from "node:test";
import assert from "node:assert/strict";
import { ascoltaAvvisoInBasso, avvisoInBasso, impostaAvvisoInBasso } from "./avviso-in-basso.ts";

test("avviso in basso: avvisa solo quando cambia e smette dopo la disiscrizione", () => {
  let volte = 0;
  const smetti = ascoltaAvvisoInBasso(() => volte++);
  assert.equal(avvisoInBasso(), false);
  impostaAvvisoInBasso(true);
  impostaAvvisoInBasso(true);
  assert.equal(avvisoInBasso(), true);
  assert.equal(volte, 1);
  smetti();
  impostaAvvisoInBasso(false);
  assert.equal(avvisoInBasso(), false);
  assert.equal(volte, 1);
});

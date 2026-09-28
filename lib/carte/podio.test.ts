import { test } from "node:test";
import assert from "node:assert/strict";
import { ordinePodio } from "./podio.ts";

// Feedback 27/09: le tre carte di maggior valore vanno su un podio.
test("il primo sta al centro: 2° – 1° – 3°", () => {
  assert.deepEqual(
    ordinePodio(["oro", "argento", "bronzo"]).map((c) => [c.carta, c.posizione]),
    [
      ["argento", 2],
      ["oro", 1],
      ["bronzo", 3],
    ]
  );
});

test("con meno di tre carte restano solo i gradini occupati", () => {
  assert.deepEqual(
    ordinePodio(["oro", "argento"]).map((c) => c.posizione),
    [2, 1]
  );
  assert.deepEqual(
    ordinePodio(["oro"]).map((c) => c.posizione),
    [1]
  );
  assert.deepEqual(ordinePodio([]), []);
});

test("oltre la terza carta viene ignorata", () => {
  assert.equal(ordinePodio([1, 2, 3, 4, 5]).length, 3);
});

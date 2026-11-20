import { test } from "node:test";
import assert from "node:assert/strict";
import { attritoValido, paginaValida, routeModello } from "./pagina.ts";

test("routeModello: id e numeri diventano [id], via la query", () => {
  assert.equal(routeModello("/novita/resoconti/3f2b8c1e-9a4d-4e2b-8f1a-1c2d3e4f5a6b"), "/novita/resoconti/[id]");
  assert.equal(routeModello("/allenamenti/sessione/42?x=1"), "/allenamenti/sessione/[id]");
  assert.equal(routeModello("/spese/gestione"), "/spese/gestione");
});

test("paginaValida: solo percorsi interni puliti, senza query", () => {
  assert.equal(paginaValida("/spese/gestione?categoria=bar&min=10"), "/spese/gestione");
  assert.equal(paginaValida("https://evil.com"), undefined);
  assert.equal(paginaValida("//evil.com"), undefined);
  assert.equal(paginaValida("/spese/<script>"), undefined);
  assert.equal(paginaValida(42), undefined);
});

test("attritoValido: tiene tipo, pagina e dettaglio corto", () => {
  assert.deepEqual(attritoValido({ tipo: "errore_api", pagina: "/spese", at: "2026-11-18T19:00:00Z", dettaglio: "500 /api/spese" }), {
    tipo: "errore_api",
    pagina: "/spese",
    at: "2026-11-18T19:00:00Z",
    dettaglio: "500 /api/spese",
  });
  assert.equal(attritoValido({ tipo: "errore_api", pagina: "https://x" }), undefined);
  assert.equal(attritoValido(null), undefined);
});

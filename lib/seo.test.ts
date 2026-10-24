import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alternatesPubbliche,
  baseUrlPubblica,
  jsonLdSicuro,
  metadataPubblica,
  percorsoLocalizzato,
} from "./seo.ts";

test("percorsi con prefisso as-needed", () => {
  assert.equal(percorsoLocalizzato("/", "it"), "/");
  assert.equal(percorsoLocalizzato("/", "en"), "/en");
  assert.equal(percorsoLocalizzato("/progetti", "it"), "/progetti");
  assert.equal(percorsoLocalizzato("/progetti/x", "en"), "/en/progetti/x");
});

test("hreflang con x-default sull'italiano", () => {
  const a = alternatesPubbliche("/progetti", "en");
  assert.equal(a?.canonical, "/en/progetti");
  assert.deepEqual(a?.languages, { it: "/progetti", en: "/en/progetti", "x-default": "/progetti" });
});

test("og nella lingua della pagina", () => {
  const m = metadataPubblica({ locale: "en", percorso: "/", title: "T", description: "D" });
  assert.equal((m.openGraph as { locale?: string }).locale, "en_US");
  assert.equal((m.openGraph as { url?: string }).url, "/en");
});

test("base url: dominio di produzione invece dell'URL del deploy", () => {
  assert.equal(baseUrlPubblica({ NEXT_PUBLIC_SITE_URL: "https://a.example" }), "https://a.example");
  assert.equal(
    baseUrlPubblica({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "b.example", VERCEL_URL: "x.vercel.app" }),
    "https://b.example",
  );
  assert.equal(baseUrlPubblica({ VERCEL_ENV: "preview", VERCEL_URL: "x.vercel.app" }), "https://x.vercel.app");
  assert.equal(baseUrlPubblica({}), "http://localhost:3000");
});

test("json-ld senza < letterali", () => {
  assert.equal(jsonLdSicuro({ a: "</script>" }), '{"a":"\\u003c/script>"}');
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alternatesPubbliche,
  baseUrlPubblica,
  jsonLdSicuro,
  metadataPubblica,
  percorsoLocalizzato,
  progettoJsonLd,
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

test("twitter card grande, immagine dalla convenzione opengraph-image", () => {
  const m = metadataPubblica({ locale: "it", percorso: "/", title: "T", description: "D" });
  assert.equal((m.twitter as { card?: string }).card, "summary_large_image");
  assert.equal((m.openGraph as { images?: unknown }).images, undefined);
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

test("pagine annidate: immagine og esplicita nella lingua giusta", () => {
  const it = metadataPubblica({ locale: "it", percorso: "/progetti/radar", title: "T", description: "D" });
  const en = metadataPubblica({ locale: "en", percorso: "/progetti/radar", title: "T", description: "D" });
  assert.equal((it.openGraph as { images: { url: string }[] }).images[0].url, "/opengraph-image");
  assert.equal((en.openGraph as { images: { url: string }[] }).images[0].url, "/en/opengraph-image");
  assert.deepEqual((en.twitter as { images: string[] }).images, ["/en/opengraph-image"]);
});

test("JSON-LD del progetto: URL assoluti, lingua e breadcrumb", () => {
  const { opera, briciole } = progettoJsonLd({
    base: "https://esempio.it",
    locale: "en",
    slug: "radar",
    nome: "Radar",
    descrizione: "Una descrizione",
  });
  assert.equal(opera["@type"], "CreativeWork");
  assert.equal(opera.url, "https://esempio.it/en/progetti/radar");
  assert.equal(opera.inLanguage, "en");
  const voci = briciole.itemListElement;
  assert.deepEqual(voci.map((v) => v.item), [
    "https://esempio.it/en",
    "https://esempio.it/en/progetti",
    "https://esempio.it/en/progetti/radar",
  ]);
  assert.equal(voci[1].name, "Projects");
});

test("JSON-LD del progetto: nessun campo vuoto", () => {
  const { opera } = progettoJsonLd({ base: "https://esempio.it", locale: "it", slug: "x", nome: "X", descrizione: "" });
  assert.equal("description" in opera, false);
  assert.equal(opera.url, "https://esempio.it/progetti/x");
});

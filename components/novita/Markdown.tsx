import Link from "next/link";
import type { Blocco, Pezzo } from "@/lib/novita/markdown";

// Rende il Markdown dei resoconti (già ridotto a blocchi sicuri da
// leggiMarkdown): solo elementi React, nessun HTML interpretato.

function Inline({ pezzi }: { pezzi: Pezzo[] }) {
  return (
    <>
      {pezzi.map((p, i) => {
        if (p.tipo === "grassetto") return <strong key={i}>{p.testo}</strong>;
        if (p.tipo === "codice")
          return (
            <code key={i} className="rounded bg-surface-hover px-1 py-0.5 text-[0.9em]">
              {p.testo}
            </code>
          );
        if (p.tipo === "link")
          return p.href.startsWith("/") ? (
            <Link key={i} href={p.href} className="text-accent underline underline-offset-2">
              {p.testo}
            </Link>
          ) : (
            <a key={i} href={p.href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
              {p.testo}
            </a>
          );
        return <span key={i}>{p.testo}</span>;
      })}
    </>
  );
}

export function Markdown({ blocchi }: { blocchi: Blocco[] }) {
  return (
    <div className="flex flex-col gap-3 text-[16px] leading-relaxed">
      {blocchi.map((b, i) => {
        if (b.tipo === "titolo") {
          const Tag = `h${b.livello}` as "h2" | "h3" | "h4";
          const stile = b.livello === 2 ? "text-[22px] font-bold" : b.livello === 3 ? "text-[19px] font-semibold" : "text-[17px] font-semibold";
          return (
            <Tag key={i} className={`${stile} mt-2 tracking-tight`}>
              <Inline pezzi={b.pezzi} />
            </Tag>
          );
        }
        if (b.tipo === "separatore") return <hr key={i} className="border-[var(--app-hairline)]" />;
        if (b.tipo === "elenco") {
          const Tag = b.ordinato ? "ol" : "ul";
          return (
            <Tag key={i} className={`flex flex-col gap-1.5 pl-5 ${b.ordinato ? "list-decimal" : "list-disc"}`}>
              {b.voci.map((v, j) => (
                <li key={j}>
                  <Inline pezzi={v} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i}>
            <Inline pezzi={b.pezzi} />
          </p>
        );
      })}
    </div>
  );
}

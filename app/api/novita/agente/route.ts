import { rifiutaSeNonAgente } from "@/lib/agenti/secret";
import { novitaDaPr, testoNotifica, type PrGrezza } from "@/lib/novita/testo-pr";
import { registraNovita } from "@/lib/novita/queries";
import { sendPushToOwner } from "@/lib/push/send";

export const runtime = "nodejs";

// POST /api/novita/agente — chiamata dal workflow feedback-deploy.yml dopo
// ogni deploy di produzione riuscito, con le PR mergiate contenute nel
// deploy. Registra le nuove come voci della sezione Novità (testo in parole
// semplici da novitaDaPr) e, se almeno una cambia qualcosa per Lorenzo,
// manda una notifica che apre /novita. Idempotente su pr_number.
//
// Corpo: { deploy_sha, prs: [{ number, title, body, labels, url, merged_at }] }

type PrInArrivo = PrGrezza & { url?: string; merged_at?: string };

export async function POST(request: Request) {
  const negato = rifiutaSeNonAgente(request);
  if (negato) return negato;

  const corpo = (await request.json().catch(() => null)) as { deploy_sha?: unknown; prs?: unknown } | null;
  if (!corpo || !Array.isArray(corpo.prs)) return Response.json({ error: "Manca prs[]." }, { status: 400 });
  const sha = typeof corpo.deploy_sha === "string" ? corpo.deploy_sha.slice(0, 40) : null;

  const righe = [];
  for (const p of corpo.prs.slice(0, 100) as PrInArrivo[]) {
    if (!Number.isInteger(p?.number) || typeof p.title !== "string") continue;
    const n = novitaDaPr({
      number: p.number,
      title: p.title,
      body: typeof p.body === "string" ? p.body : null,
      labels: Array.isArray(p.labels) ? p.labels.filter((l): l is string => typeof l === "string") : [],
    });
    righe.push({
      ...n,
      pr_number: p.number,
      pr_url: typeof p.url === "string" && p.url.startsWith("https://github.com/") ? p.url : null,
      deploy_sha: sha,
      online_dal: new Date().toISOString(),
    });
  }

  try {
    const nuove = await registraNovita(righe);
    const testo = testoNotifica(nuove);
    const push = testo ? await sendPushToOwner({ ...testo, url: "/novita", tag: "novita" }) : null;
    return Response.json({ registrate: nuove.length, notificato: push?.ok ?? false });
  } catch (e) {
    console.error("[novita] registrazione", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

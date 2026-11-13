import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { componiBackup, nomeFileBackup, TABELLE_BACKUP } from "@/lib/backup/compone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGINA = 1000;

// Solo owner (il tester in sola lettura NON può scaricare i dati): il proxy lo
// blocca già via API_VIETATE_AL_TESTER, qui è la seconda barriera.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!isOwner(user.email)) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const admin = createAdminClient();
  const risultati = await Promise.all(
    TABELLE_BACKUP.map(async (tabella) => {
      // PostgREST tronca a 1000 righe per richiesta: si legge a pagine, altrimenti
      // il backup sarebbe incompleto senza avvisare.
      const righe: unknown[] = [];
      for (let da = 0; ; da += PAGINA) {
        const { data, error } = await admin
          .from(tabella)
          .select("*")
          .range(da, da + PAGINA - 1);
        if (error) return { tabella, righe: null, errore: error.message };
        righe.push(...(data ?? []));
        if (!data || data.length < PAGINA) break;
      }
      return { tabella, righe };
    })
  );

  const adesso = new Date();
  return new NextResponse(JSON.stringify(componiBackup(risultati, adesso)), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeFileBackup(adesso)}"`,
      "Cache-Control": "no-store",
    },
  });
}

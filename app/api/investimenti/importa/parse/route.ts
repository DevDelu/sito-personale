import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseImportExcelInvestimenti } from "@/lib/investimenti/import-excel";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  const result = await parseImportExcelInvestimenti(await file.arrayBuffer());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const admin = createAdminClient();
  const { data: assets, error } = await admin.from("assets").select("id, ticker, nome");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assetMap = new Map((assets ?? []).map((a) => [a.ticker.toUpperCase(), a]));
  const errori = [...result.errori];
  const righe = [];

  for (const [i, riga] of result.righeValide.entries()) {
    const asset = assetMap.get(riga.ticker);
    if (!asset) {
      errori.push({ riga: i + 2, messaggio: `ticker "${riga.ticker}" non trovato tra gli asset esistenti.` });
      continue;
    }
    righe.push({ ...riga, asset_id: asset.id, asset_nome: asset.nome });
  }

  return NextResponse.json({ righe, errori });
}

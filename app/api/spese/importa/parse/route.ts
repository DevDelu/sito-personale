import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { parseImportExcel } from "@/lib/parsers/import-excel";
import { flagDuplicates } from "@/lib/spese/dedup";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  const result = await parseImportExcel(await file.arrayBuffer());
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const righe = await flagDuplicates(result.righeValide);

  return NextResponse.json({ righe, errori: result.errori });
}

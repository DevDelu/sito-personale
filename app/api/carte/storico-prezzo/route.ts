import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner, isTester } from "@/lib/supabase/owner";
import { getPriceHistory } from "@/lib/carte/queries";

export const runtime = "nodejs";

// Lettura dello storico prezzi di una carta. Era una Server Action (POST), che
// il proxy rifiuta al tester in sola lettura: come GET passa per tutti e due.
export async function GET(request: Request) {
  const user = await getUser();
  if (!user || !(isOwner(user.email) || isTester(user.email))) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Carta non valida." }, { status: 400 });
  }
  const prodotto = searchParams.get("prodotto");
  const idProduct = prodotto === null || prodotto === "" ? null : Number(prodotto);
  if (idProduct !== null && !Number.isInteger(idProduct)) {
    return NextResponse.json({ error: "Prodotto non valido." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getPriceHistory(id, idProduct));
  } catch {
    return NextResponse.json({ error: "Storico non disponibile." }, { status: 500 });
  }
}

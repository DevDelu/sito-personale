import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { eliminaPeso } from "@/lib/alimentazione/queries";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  try {
    await eliminaPeso(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

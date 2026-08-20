import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { GoogleReauthRequiredError } from "@/lib/agenda/google-client";
import { GoogleNotConnectedError, runGoogleSync } from "@/lib/agenda/sync";

// Sync on-demand (nessun webhook realtime, fuori scope per questa
// consegna): pull incrementale via syncToken, poi push di tutti gli eventi
// locali pending_push. Protetta da requireUser(), stesso guard usato in
// app/(private)/allenamenti/actions.ts. La logica vera e propria vive in
// lib/agenda/sync.ts, condivisa con il cron notturno (GET /api/agenda/cron-sync).
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  try {
    const result = await runGoogleSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof GoogleNotConnectedError || e instanceof GoogleReauthRequiredError) {
      return NextResponse.json({ error: e.message, reauth_required: true }, { status: 401 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

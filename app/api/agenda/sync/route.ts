import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/agenda/crypto";
import {
  GoogleReauthRequiredError,
  pullGoogleEvents,
  pushEventToGoogle,
  refreshAccessToken,
} from "@/lib/agenda/google-client";

// Sync on-demand (nessun webhook realtime, fuori scope per questa
// consegna): pull incrementale via syncToken, poi push di tutti gli eventi
// locali pending_push. Protetta da requireUser(), stesso guard usato in
// app/(private)/allenamenti/actions.ts.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const admin = createAdminClient();
  const { data: integrazione, error: integrError } = await admin
    .from("integrazione_google")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (integrError) return NextResponse.json({ error: integrError.message }, { status: 500 });
  if (!integrazione || integrazione.stato !== "connesso" || !integrazione.refresh_token_enc) {
    return NextResponse.json({ error: "Google non è collegato.", reauth_required: true }, { status: 401 });
  }

  let accessToken: string;
  try {
    const refreshToken = decryptToken(integrazione.refresh_token_enc);
    const tokens = await refreshAccessToken(refreshToken);
    accessToken = tokens.access_token;
  } catch (e) {
    if (e instanceof GoogleReauthRequiredError) {
      await admin.from("integrazione_google").update({ stato: "scaduto" }).eq("id", integrazione.id);
      return NextResponse.json({ error: e.message, reauth_required: true }, { status: 401 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // --- Pull ---
  let pull = await pullGoogleEvents(accessToken, integrazione.calendar_sync_token);
  if (pull.fullResyncRichiesto) {
    pull = await pullGoogleEvents(accessToken, null);
  }

  const pullErrori: string[] = [];
  for (const ev of pull.eventi) {
    try {
      if (ev.cancellato) {
        await admin.from("eventi").delete().eq("google_event_id", ev.google_event_id);
        continue;
      }

      const { data: locale } = await admin
        .from("eventi")
        .select("id, sync_status")
        .eq("google_event_id", ev.google_event_id)
        .maybeSingle();

      // Conflict resolution last-write-wins: una riga locale ancora da
      // pushare (pending_push) rappresenta una modifica più recente non
      // ancora propagata — vince lei, verrà ripropagata a Google nella fase
      // di push qui sotto invece di essere sovrascritta ora dal pull.
      if (locale && locale.sync_status === "pending_push") continue;

      const riga = {
        titolo: ev.titolo,
        descrizione: ev.descrizione,
        luogo: ev.luogo,
        data_inizio: ev.data_inizio,
        data_fine: ev.data_fine,
        tutto_il_giorno: ev.tutto_il_giorno,
        google_event_id: ev.google_event_id,
        source: "google_sync" as const,
        sync_status: "synced" as const,
      };

      if (locale) {
        await admin.from("eventi").update(riga).eq("id", locale.id);
      } else {
        await admin.from("eventi").insert(riga);
      }
    } catch (e) {
      pullErrori.push((e as Error).message);
    }
  }

  // --- Push ---
  const { data: daPushare, error: pushSelectError } = await admin
    .from("eventi")
    .select("*")
    .eq("sync_status", "pending_push");
  if (pushSelectError) return NextResponse.json({ error: pushSelectError.message }, { status: 500 });

  const pushErrori: string[] = [];
  for (const evento of daPushare ?? []) {
    try {
      const googleId = await pushEventToGoogle(
        {
          google_event_id: evento.google_event_id,
          titolo: evento.titolo,
          descrizione: evento.descrizione,
          luogo: evento.luogo,
          data_inizio: evento.data_inizio,
          data_fine: evento.data_fine,
          tutto_il_giorno: evento.tutto_il_giorno,
        },
        accessToken
      );
      await admin.from("eventi").update({ google_event_id: googleId, sync_status: "synced" }).eq("id", evento.id);
    } catch (e) {
      pushErrori.push((e as Error).message);
    }
  }

  await admin
    .from("integrazione_google")
    .update({
      ultimo_sync: new Date().toISOString(),
      calendar_sync_token: pull.nextSyncToken ?? integrazione.calendar_sync_token,
      access_token: accessToken,
    })
    .eq("id", integrazione.id);

  return NextResponse.json({
    ok: true,
    pull: { totale: pull.eventi.length, errori: pullErrori },
    push: { totale: (daPushare ?? []).length, errori: pushErrori },
  });
}

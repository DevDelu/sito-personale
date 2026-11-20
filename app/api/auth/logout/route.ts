import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Logout come route handler, non Server Action: il proxy blocca ogni
// richiesta non GET del tester sulle pagine private (Server Action
// comprese), quindi con la action il tester non riusciva a uscire e il
// browser mostrava "This page couldn't load". Questa rotta è in
// API_AUTONOME: uscire è innocuo per chiunque.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

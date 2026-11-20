import "server-only";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";

// Seconda barriera per le API dell'assistente (la prima è il proxy): solo
// l'owner, mai il tester in sola lettura, perché parlare crea bozze e usa
// la quota Groq.
export async function rifiutaSeNonOwner(): Promise<Response | null> {
  const user = await getUser();
  if (user && isOwner(user.email)) return null;
  return Response.json({ error: "Non autorizzato." }, { status: user ? 403 : 401 });
}

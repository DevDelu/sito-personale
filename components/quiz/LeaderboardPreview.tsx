import { createClient } from "@/lib/supabase/server";
import { Leaderboard } from "./Leaderboard";

// Server Component async: query diretta alla view pubblica (client anon,
// RLS+grant per select limitati a nickname/score/time_taken_ms, mai lo
// user_id). Il refresh periodico è gestito da `revalidate` sulla pagina
// homepage, non qui.
export async function LeaderboardPreview() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_leaderboard")
    .select("rank, nickname, score, time_taken_ms")
    .order("rank", { ascending: true })
    .limit(5);

  return <Leaderboard rows={data ?? []} />;
}

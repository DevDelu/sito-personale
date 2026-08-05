import { redirect } from "next/navigation";
import { creaSessione } from "../../actions";

export default async function NuovaSessionePage({
  searchParams,
}: {
  searchParams: Promise<{ scheda?: string }>;
}) {
  const { scheda } = await searchParams;
  if (!scheda) redirect("/allenamenti");

  const res = await creaSessione(scheda);
  if ("error" in res) redirect("/allenamenti");

  redirect(`/allenamenti/sessione/${res.id}`);
}

import type { Metadata } from "next";
import { getSchedeConMeta } from "@/lib/allenamento/queries";
import { SchedeList } from "@/components/allenamento/SchedeList";

export const metadata: Metadata = { title: "Allenamento · Le mie schede" };

export default async function LeMieSchedePage() {
  const schede = await getSchedeConMeta({ includeArchiviate: true });
  return <SchedeList schede={schede} />;
}

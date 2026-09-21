import type { Metadata } from "next";
import { PushSettings } from "@/components/push/PushSettings";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Impostazioni" };

export default function ImpostazioniPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Impostazioni" />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-sm text-muted">Preferenze dell&apos;app installata come PWA.</p>
      </div>

      <section className="card flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-medium">Notifiche</h2>
          <p className="text-sm text-muted">
            Notifiche push sul dispositivo, indipendenti dall&apos;email. Su iPhone funzionano solo dall&apos;app
            installata (Safari → Condividi → Aggiungi a Home).
          </p>
        </div>
        <PushSettings />
      </section>
    </div>
  );
}

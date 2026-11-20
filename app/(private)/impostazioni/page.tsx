import type { Metadata } from "next";
import { PushSettings } from "@/components/push/PushSettings";
import { VibrazioneSettings } from "@/components/impostazioni/VibrazioneSettings";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Impostazioni" };

export default function ImpostazioniPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Impostazioni" parent={{ href: "/altro", label: "Altro" }} />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-sm text-muted">Preferenze dell&apos;app installata come PWA.</p>
      </div>

      <div data-fb-area="impostazioni.notifiche" className="contents">
        <ListGroup title="Notifiche">
          <div className="py-4 pr-4">
            <PushSettings />
          </div>
        </ListGroup>
        <p className="-mt-4 px-1 text-[13px] text-muted md:text-sm">
          Notifiche push sul dispositivo, indipendenti dall&apos;email. Su iPhone funzionano solo dall&apos;app
          installata (Safari → Condividi → Aggiungi a Home).
        </p>
      </div>

      <div data-fb-area="impostazioni.vibrazione" className="contents">
        <ListGroup title="Vibrazione">
          <div className="py-3 pr-4">
            <VibrazioneSettings />
          </div>
        </ListGroup>
        <p className="-mt-4 px-1 text-[13px] text-muted md:text-sm">
          Un tocco leggero quando completi una serie o apri il feedback con la pressione lunga.
        </p>
      </div>
    </div>
  );
}

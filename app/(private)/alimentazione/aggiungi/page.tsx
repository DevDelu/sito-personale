import type { Metadata } from "next";
import { getAlimenti, getPasti, getPastiTraDate } from "@/lib/alimentazione/queries";
import { getTemplatePasti } from "@/lib/alimentazione/template";
import { AddMealForm } from "./add-meal-form";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Alimentazione · Aggiungi pasto" };

export default async function AggiungiPastoPage() {
  const adesso = new Date();
  const oggi = adesso.toISOString().slice(0, 10);
  adesso.setUTCDate(adesso.getUTCDate() - 30);
  const da = adesso.toISOString().slice(0, 10);
  const [alimenti, { rows: recenti }, pastiMese, templates] = await Promise.all([
    getAlimenti(),
    getPasti({ page: 1, pageSize: 20 }),
    getPastiTraDate(da, oggi),
    getTemplatePasti(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Aggiungi pasto" parent={{ href: "/alimentazione", label: "Alimentazione" }} />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Aggiungi pasto</h1>
        <p className="text-sm text-muted">
          Scegli un alimento dal catalogo o creane uno nuovo al volo, indica la quantità e salva. Se il giorno e il
          pasto selezionati hanno un template, puoi registrarlo in un colpo solo.
        </p>
      </div>
      <div data-fb-area="alimentazione.aggiungi.form" className="contents">
        <AddMealForm alimenti={alimenti} pastiRecenti={recenti} pastiMese={pastiMese} oggi={oggi} templates={templates} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getAlimenti, getPasti } from "@/lib/alimentazione/queries";
import { getTemplatePasti } from "@/lib/alimentazione/template";
import { AddMealForm } from "./add-meal-form";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Alimentazione · Aggiungi pasto" };

export default async function AggiungiPastoPage() {
  const [alimenti, { rows: recenti }, templates] = await Promise.all([
    getAlimenti(),
    getPasti({ page: 1, pageSize: 20 }),
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
      <AddMealForm alimenti={alimenti} pastiRecenti={recenti} templates={templates} />
    </div>
  );
}

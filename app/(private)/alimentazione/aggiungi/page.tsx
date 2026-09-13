import type { Metadata } from "next";
import { getAlimenti, getPasti } from "@/lib/alimentazione/queries";
import { AddMealForm } from "./add-meal-form";

export const metadata: Metadata = { title: "Alimentazione · Aggiungi pasto" };

export default async function AggiungiPastoPage() {
  const [alimenti, { rows: recenti }] = await Promise.all([
    getAlimenti(),
    getPasti({ page: 1, pageSize: 20 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Aggiungi pasto</h1>
        <p className="text-sm text-muted">
          Scegli un alimento dal catalogo o creane uno nuovo al volo, indica la quantità e salva.
        </p>
      </div>
      <AddMealForm alimenti={alimenti} pastiRecenti={recenti} />
    </div>
  );
}

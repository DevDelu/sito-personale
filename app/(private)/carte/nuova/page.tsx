import type { Metadata } from "next";
import { AddCardForm } from "./add-card-form";

export const metadata: Metadata = { title: "Carte · Nuova carta" };

export default function NuovaCartaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold tracking-tight">Aggiungi carta</h1>
      <AddCardForm />
    </div>
  );
}

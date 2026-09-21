import type { Metadata } from "next";
import { AddCardForm } from "./add-card-form";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Carte · Nuova carta" };

export default function NuovaCartaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Aggiungi carta" parent={{ href: "/carte", label: "Carte" }} />
      <h1 className="hidden font-display text-xl font-semibold tracking-tight md:block">Aggiungi carta</h1>
      <AddCardForm />
    </div>
  );
}

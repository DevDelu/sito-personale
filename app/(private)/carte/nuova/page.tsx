import { AddCardForm } from "./add-card-form";

export default function NuovaCartaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold tracking-tight">Aggiungi carta</h1>
      <AddCardForm />
    </div>
  );
}

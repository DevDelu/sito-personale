import type { Metadata } from "next";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Spese · Importa" };

export default function ImportaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Importa da Excel
        </h1>
        <p className="text-sm text-muted">
          Carica il file già categorizzato generato dalla chat dedicata.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}

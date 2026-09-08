import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recupera password" };

export default function RecuperaPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="flex max-w-sm flex-col gap-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Recupera password
        </h1>
        <p className="text-sm text-muted">
          Inserisci la tua email: se registrata, riceverai un link per reimpostare la password.
        </p>
      </div>
      <RecoverForm />
    </main>
  );
}

import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { appViewport } from "@/lib/app-viewport";

export const metadata: Metadata = { title: "Accedi" };
export const viewport = appViewport;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    // .app-shell: stesse fondamenta mobile dell'area privata (campi a 17px,
    // safe-area, font di sistema sotto 768px) anche nella schermata di
    // accesso, così l'esperienza è coerente dal primo tap in poi.
    <main className="app-shell flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-8 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center gap-1">
        <span className="app-static font-display text-xl font-semibold tracking-tight">Radar</span>
        <h1 className="text-sm text-muted">Area privata</h1>
      </div>
      <LoginForm redirectTo={redirect ?? "/spese"} />
    </main>
  );
}

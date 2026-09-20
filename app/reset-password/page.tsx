import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";
import { appViewport } from "@/lib/app-viewport";

export const metadata: Metadata = { title: "Reimposta password" };
export const viewport = appViewport;

export default function ResetPasswordPage() {
  return (
    <main className="app-shell flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-8 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Reimposta password
      </h1>
      <ResetPasswordForm />
    </main>
  );
}

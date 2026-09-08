import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reimposta password" };

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Reimposta password
      </h1>
      <ResetPasswordForm />
    </main>
  );
}

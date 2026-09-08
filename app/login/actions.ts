"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type LoginState = { error?: string } | undefined;

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Alert diradato (non uno a tentativo, altrimenti sommerge la casella) sui
// tentativi di login sospetti — usa una chiave e una finestra separate dal
// rate limit vero e proprio, così l'invio email non si ripete a ogni
// richiesta bloccata nello stesso minuto.
async function inviaAvvisoTentativiSospetti(ip: string): Promise<void> {
  if (!checkRateLimit(`login-alert:${ip}`, { max: 1, windowMs: 15 * 60_000 }).allowed) {
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.LOGIN_ALERT_EMAIL || process.env.AGENDA_ALERT_EMAIL;
  if (!apiKey || !destinatario) {
    console.error("Login: impossibile inviare l'alert (RESEND_API_KEY o LOGIN_ALERT_EMAIL non impostate).");
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Radar <onboarding@resend.dev>",
    to: destinatario,
    subject: "Radar: tentativi di login sospetti rilevati",
    html: `
      <p>Sono stati rilevati più tentativi di accesso falliti da un indirizzo IP nelle ultime ore.</p>
      <p>Se non sei stato tu, non serve nessuna azione immediata: il rate limit blocca già i tentativi automatici.</p>
      <p><a href="${siteUrl()}/login">Vai alla pagina di login</a></p>
    `,
  });
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await getClientIp();

  if (!checkRateLimit(`login:${ip}`, { max: 5, windowMs: 60_000 }).allowed) {
    await inviaAvvisoTentativiSospetti(ip);
    return { error: "Troppi tentativi, riprova tra poco." };
  }

  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  if (!turnstileToken || !(await verifyTurnstileToken(turnstileToken, ip))) {
    return { error: "Verifica anti-spam non superata, riprova." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/spese");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o password non corrette." };
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/spese");
}

export type RequestResetState = { error?: string; sent?: boolean } | undefined;

// La risposta è identica per email esistente e inesistente (il messaggio
// "sent" è nel form): non conferma se un indirizzo è registrato — l'app ha
// comunque un solo account, quello del proprietario, ma resta la pratica
// corretta per un form pubblico.
export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const ip = await getClientIp();

  if (!checkRateLimit(`reset-request:${ip}`, { max: 3, windowMs: 15 * 60_000 }).allowed) {
    return { error: "Troppi tentativi, riprova tra poco." };
  }

  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  if (!turnstileToken || !(await verifyTurnstileToken(turnstileToken, ip))) {
    return { error: "Verifica anti-spam non superata, riprova." };
  }

  const email = String(formData.get("email") ?? "");
  if (!email) {
    return { error: "Inserisci un indirizzo email." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?redirect_to=/reset-password`,
  });

  return { sent: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { Resend } from "resend";

export type ContactState = { error?: string; success?: boolean } | undefined;

const ERRORS = {
  it: {
    required: "Compila tutti i campi.",
    invalidEmail: "Inserisci un'email valida.",
    unavailable: "Servizio momentaneamente non disponibile, riprova più tardi.",
    sendFailed: "Invio non riuscito, riprova più tardi.",
  },
  en: {
    required: "Please fill in all fields.",
    invalidEmail: "Enter a valid email address.",
    unavailable: "Service temporarily unavailable, please try again later.",
    sendFailed: "Sending failed, please try again later.",
  },
} as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendContactMessage(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const locale = String(formData.get("locale") ?? "it") === "en" ? "en" : "it";
  const errors = ERRORS[locale];

  // Honeypot: campo invisibile per gli umani, spesso compilato dai bot.
  if (String(formData.get("azienda") ?? "").trim() !== "") {
    return { success: true };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: errors.required };
  }
  if (!isValidEmail(email)) {
    return { error: errors.invalidEmail };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || process.env.AGENDA_ALERT_EMAIL;
  if (!apiKey || !to) {
    console.error("Contatti: impossibile inviare il messaggio (RESEND_API_KEY o CONTACT_TO_EMAIL non impostate).");
    return { error: errors.unavailable };
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `Nuovo messaggio dal sito — ${name}`,
      html: `
        <p><strong>Da:</strong> ${name} (${email})</p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });
  } catch (e) {
    console.error("Contatti: invio email fallito.", e);
    return { error: errors.sendFailed };
  }

  return { success: true };
}

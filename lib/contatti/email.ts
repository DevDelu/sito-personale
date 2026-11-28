// Corpo dell'email del form contatti. Nome, indirizzo e messaggio li scrive un
// visitatore: nell'HTML entrano solo come testo.
const SOSTITUZIONI: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function comeTesto(valore: string): string {
  return valore.replace(/[&<>"']/g, (c) => SOSTITUZIONI[c]);
}

export function componiEmailContatto(nome: string, email: string, messaggio: string) {
  return {
    subject: `Nuovo messaggio dal sito — ${nome.replace(/\s+/g, " ")}`,
    html: `
        <p><strong>Da:</strong> ${comeTesto(nome)} (${comeTesto(email)})</p>
        <p>${comeTesto(messaggio).replace(/\r?\n/g, "<br />")}</p>
      `,
  };
}

#!/usr/bin/env node
// Registra il webhook del bot Telegram e i comandi. Da lanciare una volta
// (e di nuovo se cambiano dominio o secret):
//
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
//   node scripts/telegram-setup.mjs https://lorenzo-de-luca.com
//
// Il secret viaggia nell'header X-Telegram-Bot-Api-Secret-Token di ogni
// chiamata: la route lo confronta con TELEGRAM_WEBHOOK_SECRET su Vercel.

const [, , base] = process.argv;
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!base || !token || !secret) {
  console.error("Uso: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/telegram-setup.mjs https://tuo-dominio");
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET: 16-256 caratteri tra A-Z a-z 0-9 _ - (vincolo di Telegram)");
  process.exit(1);
}

async function chiama(metodo, corpo) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${metodo}: ${json.description}`);
  return json.result;
}

const url = `${base.replace(/\/$/, "")}/api/telegram/webhook`;
await chiama("setWebhook", {
  url,
  secret_token: secret,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
});
await chiama("setMyCommands", {
  commands: [
    { command: "aiuto", description: "Cosa posso fare" },
  ],
});
const info = await chiama("getWebhookInfo", {});
console.log("Webhook registrato:", info.url);
if (info.last_error_message) console.log("Ultimo errore:", info.last_error_message);

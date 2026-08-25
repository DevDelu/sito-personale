import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Header di sicurezza applicati a ogni risposta: Vercel imposta alcuni
// default ma non tutti, meglio esplicitarli qui. Niente Content-Security-
// Policy globale in questo giro (rischio di rompere Framer Motion / script
// inline di next-intl senza un audit dedicato dei nonce) — backlog separato.
async function headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
}

const nextConfig: NextConfig = {
  headers,
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Serve solo SVG locali committati da noi in public/ (es. cover dei case
    // study /progetti), mai upload di terzi: rischio XSS minimo, mitigato
    // comunque con sandbox/CSP dedicata sull'endpoint di ottimizzazione
    // immagini, come da raccomandazione Next.js.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
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

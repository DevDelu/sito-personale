import type { MetadataRoute } from "next";
import { baseUrlPubblica, PERCORSI_NON_INDICIZZABILI } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = baseUrlPubblica();
  return {
    rules: { userAgent: "*", allow: "/", disallow: PERCORSI_NON_INDICIZZABILI },
    sitemap: `${base}/sitemap.xml`,
  };
}

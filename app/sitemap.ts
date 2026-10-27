import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { baseUrlPubblica, vociSitemap } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const slug = getProjects("it").map((p) => p.slug);
  return vociSitemap(baseUrlPubblica(), slug);
}

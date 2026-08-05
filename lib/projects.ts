import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Project } from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");
const DEFAULT_LOCALE = "it";

// File senza suffisso di lingua (`slug.mdx`) = italiano, la lingua di
// default. Una traduzione è un file separato `slug.<locale>.mdx` accanto
// all'originale — se manca per una lingua non di default, si ricade
// sull'italiano invece di un 404: meglio un case study non tradotto che
// assente.
function readProjectFile(slug: string, filename: string): Project {
  const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  return {
    slug: data.slug ?? slug,
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    category: data.category,
    cover: data.cover ?? "",
    tags: data.tags ?? [],
    year: data.year,
    featured: data.featured ?? false,
    role: data.role,
    summary: data.summary ?? "",
    accentColors: data.accentColors,
    links: data.links,
    stats: data.stats,
    content,
  };
}

function resolveFilename(slug: string, locale: string): string | undefined {
  if (locale !== DEFAULT_LOCALE) {
    const localized = `${slug}.${locale}.mdx`;
    if (fs.existsSync(path.join(PROJECTS_DIR, localized))) return localized;
  }
  const base = `${slug}.mdx`;
  return fs.existsSync(path.join(PROJECTS_DIR, base)) ? base : undefined;
}

// Slug canonici: solo i file base (`slug.mdx`), non le varianti di lingua
// (`slug.en.mdx`) — altrimenti una traduzione conterebbe come progetto a sé.
function listSlugs(): string[] {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((filename) => /^[^.]+\.mdx$/.test(filename))
    .map((filename) => filename.replace(/\.mdx$/, ""));
}

export function getProjects(locale: string = DEFAULT_LOCALE): Project[] {
  return listSlugs()
    .map((slug) => {
      const filename = resolveFilename(slug, locale);
      return filename ? readProjectFile(slug, filename) : undefined;
    })
    .filter((project): project is Project => project !== undefined)
    .sort((a, b) => b.year - a.year);
}

export function getFeaturedProjects(locale: string = DEFAULT_LOCALE, limit = 3): Project[] {
  return getProjects(locale)
    .filter((project) => project.featured)
    .slice(0, limit);
}

export function getProjectBySlug(slug: string, locale: string = DEFAULT_LOCALE): Project | undefined {
  const filename = resolveFilename(slug, locale);
  return filename ? readProjectFile(slug, filename) : undefined;
}

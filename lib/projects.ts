import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Project } from "@/types/project";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

function readProjectFile(filename: string): Project {
  const slug = filename.replace(/\.mdx$/, "");
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

export function getProjects(): Project[] {
  const filenames = fs
    .readdirSync(PROJECTS_DIR)
    .filter((filename) => filename.endsWith(".mdx"));

  return filenames
    .map(readProjectFile)
    .sort((a, b) => b.year - a.year);
}

export function getProjectBySlug(slug: string): Project | undefined {
  const filename = `${slug}.mdx`;

  if (!fs.existsSync(path.join(PROJECTS_DIR, filename))) {
    return undefined;
  }

  return readProjectFile(filename);
}

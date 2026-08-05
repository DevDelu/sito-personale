import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/progetti/project-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Progetti" });
  return { title: t("title"), description: t("description") };
}

export default async function ProgettiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = getProjects(locale);
  const t = await getTranslations("Progetti");
  const tCategory = await getTranslations("ProjectCategory");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-4xl font-medium italic text-[#221f19]">{t("title")}</h1>
      <p className="mt-3 max-w-[44ch] text-base leading-relaxed text-[#5c5546]">{t("description")}</p>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} categoryLabel={tCategory(project.category)} />
        ))}
      </div>
    </div>
  );
}

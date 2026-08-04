import type { Metadata } from "next";
import { getProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/progetti/project-card";

export const metadata: Metadata = {
  title: "Progetti",
  description: "Case study e progetti selezionati.",
};

export default function ProgettiPage() {
  const projects = getProjects();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-4xl font-medium italic text-[#221f19]">Progetti</h1>
      <p className="mt-3 max-w-[44ch] text-base leading-relaxed text-[#5c5546]">
        Una selezione di case study: tesi, progetti personali e lavoro.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}

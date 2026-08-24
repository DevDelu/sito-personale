import { createElement } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { projectCategoryIcon } from "@/lib/project-style";
import type { Project } from "@/types/project";

export function ProjectCard({ project, categoryLabel }: { project: Project; categoryLabel: string }) {
  return (
    <Link
      href={`/progetti/${project.slug}`}
      className="group block overflow-hidden rounded-md border border-border bg-surface transition-transform duration-150 ease-out hover:-translate-y-0.5"
    >
      {project.cover ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-hover">
          <Image
            src={project.cover}
            alt={project.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 p-5">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-muted">
          {createElement(projectCategoryIcon(project.category), {
            className: "h-3.5 w-3.5 text-accent",
            strokeWidth: 2,
          })}
          {categoryLabel}
        </span>

        <h3 className="font-display text-xl font-medium italic text-foreground">{project.title}</h3>

        <p className="text-sm leading-relaxed text-muted">{project.summary}</p>

        {project.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

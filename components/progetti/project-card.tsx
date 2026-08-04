import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";
import { CATEGORY_LABELS } from "@/lib/progetti-theme";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/progetti/${project.slug}`}
      className="group block overflow-hidden rounded-md border border-[#e5ddc9] bg-[#FAF6EC] transition-transform duration-150 ease-out hover:-translate-y-0.5"
    >
      {project.cover ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e5ddc9]">
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
        <span className="font-mono text-xs uppercase tracking-wide text-[#8a8272]">
          {CATEGORY_LABELS[project.category] ?? project.category}
        </span>

        <h3 className="font-display text-xl font-medium italic text-[#221f19]">{project.title}</h3>

        <p className="text-sm leading-relaxed text-[#5c5546]">{project.summary}</p>

        {project.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#e5ddc9] px-2 py-0.5 font-mono text-[11px] text-[#5c5546]"
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

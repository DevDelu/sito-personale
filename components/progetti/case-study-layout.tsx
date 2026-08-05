import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { CSSProperties } from "react";
import type { Project } from "@/types/project";
import { getAccentColors } from "@/lib/progetti-theme";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { StatNumber } from "@/components/progetti/stat-number";
import { MdxH2, MdxP, MdxUl } from "@/components/progetti/mdx-elements";
import { Link } from "@/i18n/navigation";

const mdxComponents = { h2: MdxH2, p: MdxP, ul: MdxUl };

export function CaseStudyLayout({
  project,
  categoryLabel,
  backLinkLabel,
}: {
  project: Project;
  categoryLabel: string;
  backLinkLabel: string;
}) {
  const accent = getAccentColors(project.accentColors);

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <RevealGroup className="flex flex-col">
        <RevealItem>
          <Link
            href="/progetti"
            className="font-mono text-sm text-[#5c5546] transition-colors hover:text-[#221f19]"
          >
            ← {backLinkLabel}
          </Link>
        </RevealItem>

        <RevealItem className="mt-8">
          <span className="font-mono text-xs uppercase tracking-wide" style={{ color: accent.primary }}>
            {categoryLabel} · {project.year}
          </span>
        </RevealItem>

        <RevealItem className="mt-3">
          <h1 className="font-display text-4xl font-medium italic text-[#221f19]">{project.title}</h1>
        </RevealItem>

        <RevealItem className="mt-4">
          <p className="max-w-[44ch] text-base leading-relaxed text-[#5c5546]">{project.summary}</p>
        </RevealItem>

        {project.cover ? (
          <RevealItem className="mt-8">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-[#e5ddc9]">
              <Image src={project.cover} alt={project.title} fill sizes="100vw" className="object-cover" />
            </div>
          </RevealItem>
        ) : null}

        {project.stats && project.stats.length > 0 ? (
          <RevealItem className="mt-10 grid grid-cols-3 gap-6 border-y border-[#e5ddc9] py-6">
            {project.stats.map((stat, index) => {
              const colors = [accent.primary, accent.secondary, accent.tertiary];
              return (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span
                    className="font-display text-3xl font-medium"
                    style={{ color: colors[index % colors.length] }}
                  >
                    <StatNumber value={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="font-sans text-xs text-[#8a8272]">{stat.label}</span>
                </div>
              );
            })}
          </RevealItem>
        ) : null}
      </RevealGroup>

      <div
        className="mt-4 [&_h2:nth-of-type(even)]:[border-left-color:var(--accent-tertiary)] [&_h2:nth-of-type(odd)]:[border-left-color:var(--accent-primary)]"
        style={
          {
            "--accent-primary": accent.primary,
            "--accent-tertiary": accent.tertiary,
          } as CSSProperties
        }
      >
        <MDXRemote source={project.content} components={mdxComponents} />
      </div>

      {project.links && project.links.length > 0 ? (
        <div className="mt-12 flex flex-wrap gap-4 border-t border-[#e5ddc9] pt-8">
          {project.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-sm transition-transform duration-150 ease-out hover:-translate-y-0.5"
              style={{ borderColor: accent.primary, color: accent.primary }}
            >
              {link.label} →
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

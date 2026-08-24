import { getTranslations } from "next-intl/server";
import { Users, Palette, Code2, type LucideIcon } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

const GROUP_ICONS: LucideIcon[] = [Users, Palette, Code2];

export async function Skills() {
  const t = await getTranslations("Skills");
  const groups = t.raw("groups") as { title: string; items: string[] }[];

  return (
    <section id="competenze" className="mx-auto w-full max-w-5xl px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h2>
        </RevealItem>
        <RevealItem className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {groups.map((group, index) => {
            const Icon = GROUP_ICONS[index % GROUP_ICONS.length];
            return (
              <div key={group.title} className="card flex flex-col gap-3 p-5">
                <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
                <h3 className="font-display text-lg font-medium">{group.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </RevealItem>
      </RevealGroup>
    </section>
  );
}

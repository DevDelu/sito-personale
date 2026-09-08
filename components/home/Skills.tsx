import { getTranslations } from "next-intl/server";
import { Users, Palette, Code2, type LucideIcon } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

const GROUP_ICONS: LucideIcon[] = [Users, Palette, Code2];

export async function Skills() {
  const t = await getTranslations("Skills");
  const groups = t.raw("groups") as { title: string; items: string[] }[];

  return (
    <section id="competenze" className="mx-auto w-full max-w-5xl border-t border-border px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <h2 className="font-display max-w-md text-2xl font-medium tracking-tight sm:text-3xl">{t("title")}</h2>
        </RevealItem>
        {/* Lista asimmetrica invece della griglia a 3 colonne icona-sopra-titolo:
            l'icona vive a fianco del titolo (non sopra), le colonne hanno larghezze
            diverse e le righe sono separate da una linea, non da card affiancate. */}
        <RevealItem className="mt-8 flex flex-col divide-y divide-border border-t border-border">
          {groups.map((group, index) => {
            const Icon = GROUP_ICONS[index % GROUP_ICONS.length];
            return (
              <div key={group.title} className="flex flex-col gap-3 py-6 sm:flex-row sm:items-baseline sm:gap-10">
                <h3 className="flex shrink-0 items-center gap-2 font-sans text-sm font-semibold sm:w-52">
                  <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
                  {group.title}
                </h3>
                <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1.5 font-mono text-[13px] text-muted">
                  {group.items.map((item, i) => (
                    <span key={item}>
                      {item}
                      {i < group.items.length - 1 ? <span className="text-border"> /</span> : null}
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

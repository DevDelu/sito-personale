import { getTranslations } from "next-intl/server";
import { Dumbbell, Layers, TrendingUp, Code2, type LucideIcon } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

const HOBBY_ICONS: LucideIcon[] = [Dumbbell, Layers, TrendingUp, Code2];

export async function Hobbies() {
  const t = await getTranslations("Hobbies");
  const items = t.raw("items") as { title: string; description: string }[];

  return (
    <section id="passioni" className="mx-auto w-full max-w-5xl px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h2>
        </RevealItem>
        <RevealItem className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = HOBBY_ICONS[index % HOBBY_ICONS.length];
            return (
              <div key={item.title} className="card flex flex-col gap-2 p-5">
                <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
                <h3 className="font-display text-base font-medium">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            );
          })}
        </RevealItem>
      </RevealGroup>
    </section>
  );
}

"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const variantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

function useSectionVariants() {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? variantsReduced : variants;
}

/** h2/p/ul del corpo MDX: ognuno entra da solo in whileInView, così
 * l'effetto vale anche per case study lunghi. Il colore alternato del
 * bordo sinistro degli h2 è gestito via CSS (nth-of-type) dal wrapper
 * in CaseStudyLayout, non da uno stato JS mutato durante il render.
 * Si accetta solo `children` (non si spreadano le props DOM grezze):
 * i tipi degli event handler HTML e quelli di motion sono incompatibili. */
export function MdxH2({ children }: { children?: ReactNode }) {
  const variants = useSectionVariants();

  return (
    <motion.h2
      className="font-display mt-12 mb-4 border-l-[3px] border-solid pl-4 text-2xl font-medium italic text-foreground"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
    >
      {children}
    </motion.h2>
  );
}

export function MdxP({ children }: { children?: ReactNode }) {
  const variants = useSectionVariants();

  return (
    <motion.p
      className="mb-4 text-[15px] leading-[1.75] text-muted"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
    >
      {children}
    </motion.p>
  );
}

export function MdxUl({ children }: { children?: ReactNode }) {
  const variants = useSectionVariants();

  return (
    <motion.ul
      className="mb-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.75] text-muted"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
    >
      {children}
    </motion.ul>
  );
}

/** Immagine nel corpo MDX, generata dalla sintassi standard `![alt](src "caption")`.
 * Altezza fissa + object-contain invece di `fill`/aspect noto: le immagini vengono
 * da fonti eterogenee (screenshot, sketch, grafici) con rapporti d'aspetto diversi
 * e nessuna width/height esplicita arriva dal markdown. */
export function MdxImg({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  const variants = useSectionVariants();

  if (!src) return null;

  return (
    <motion.figure
      className="mb-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
    >
      <div className="relative h-48 w-full overflow-hidden rounded-md border border-border bg-surface-hover sm:h-72 md:h-80">
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-contain p-4"
        />
      </div>
      {title ? <figcaption className="mt-2 text-center text-xs text-muted">{title}</figcaption> : null}
    </motion.figure>
  );
}

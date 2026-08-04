"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
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
      className="font-display mt-12 mb-4 border-l-[3px] border-solid pl-4 text-2xl font-medium italic text-[#221f19]"
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
      className="mb-4 text-[15px] leading-[1.75] text-[#5c5546]"
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
      className="mb-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.75] text-[#5c5546]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
    >
      {children}
    </motion.ul>
  );
}

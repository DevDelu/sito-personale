"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

/** Contenitore del momento orchestrato: i figli (RevealItem) entrano in
 * stagger al mount, seguendo lo stato "visible" del genitore. */
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Un elemento animato. Dentro a RevealGroup eredita lo stagger dal
 * genitore; con inView entra da solo quando raggiunge il viewport
 * (usato per le sezioni più in basso nei case study lunghi). */
export function RevealItem({
  children,
  className,
  inView = false,
}: {
  children: ReactNode;
  className?: string;
  inView?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? itemVariantsReduced : itemVariants;

  if (inView) {
    return (
      <motion.div
        className={className}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

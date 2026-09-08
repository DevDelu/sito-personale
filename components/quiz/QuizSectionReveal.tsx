"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Wrapper client minimo: la card "pop" quando la sezione entra nel
// viewport (arrivando scrollando), non solo al caricamento della pagina —
// deve sentirsi come un invito che si "lancia" incontro a chi legge, non
// un'altra sezione statica. Il contenuto (server + client misti: teaser
// testuale, top 5 da Supabase, CTA) resta un children passato dal
// QuizSection server component, come da pattern Next.js per i client
// wrapper "puri" (nessun import diretto di Server Component qui dentro).
export function QuizSectionReveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative rounded-2xl border-2 border-accent/25 bg-surface p-6 shadow-lg sm:p-10"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

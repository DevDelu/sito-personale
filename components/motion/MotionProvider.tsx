"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

// Le animazioni dell'area pubblica usano il componente `m` (non `motion`):
// le feature (animate, whileInView, variants) arrivano da un chunk separato
// caricato dopo l'idratazione, invece di stare nel bundle iniziale della home.
// `strict` fa lanciare un errore in sviluppo se qualcuno importa di nuovo
// `motion` dentro questo albero.
const caricaFeature = () => import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={caricaFeature} strict>
      {children}
    </LazyMotion>
  );
}

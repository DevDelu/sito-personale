"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

// Due bagliori sfocati dietro l'hero che seguono il cursore con un lag
// elastico (spring), a profondità diverse per un minimo di parallasse.
// Stesso linguaggio visivo del bagliore statico della sezione quiz
// (bg-accent/10 blur-3xl), qui reattivo al mouse. Con prefers-reduced-motion
// resta uno sfondo statico, nessun listener sul mousemove.
export function HeroCursorField() {
  const reduceMotion = useReducedMotion();

  const rawX1 = useMotionValue(0);
  const rawY1 = useMotionValue(0);
  const rawX2 = useMotionValue(0);
  const rawY2 = useMotionValue(0);
  const spring = { damping: 25, stiffness: 50, mass: 0.7 };
  const x1 = useSpring(rawX1, spring);
  const y1 = useSpring(rawY1, spring);
  const x2 = useSpring(rawX2, { ...spring, damping: 30, stiffness: 35 });
  const y2 = useSpring(rawY2, { ...spring, damping: 30, stiffness: 35 });

  useEffect(() => {
    if (reduceMotion) return;

    function handlePointerMove(e: PointerEvent) {
      const dx = e.clientX - window.innerWidth / 2;
      const dy = e.clientY - window.innerHeight / 2;
      // Spostamento contenuto (frazione della distanza dal centro), non un
      // inseguimento 1:1 del cursore: deve sentirsi come uno sfondo vivo,
      // non come un elemento che "insegue" il mouse sullo schermo.
      rawX1.set(dx * 0.12);
      rawY1.set(dy * 0.12);
      rawX2.set(dx * -0.06);
      rawY2.set(dy * -0.06);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [reduceMotion, rawX1, rawY1, rawX2, rawY2]);

  if (reduceMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[30%] top-[28%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[72%] top-[62%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.08] blur-3xl" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute h-80 w-80 rounded-full bg-accent/10 blur-3xl"
        style={{ left: "30%", top: "28%", marginLeft: -160, marginTop: -160, x: x1, y: y1 }}
      />
      <motion.div
        className="absolute h-64 w-64 rounded-full bg-accent/[0.08] blur-3xl"
        style={{ left: "72%", top: "62%", marginLeft: -128, marginTop: -128, x: x2, y: y2 }}
      />
    </div>
  );
}

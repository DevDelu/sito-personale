"use client";

import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from "motion/react";

// La headline reagisce al cursore in due modi, entrambi ancorati alla
// posizione del mouse dentro il proprio riquadro: un lieve tilt 3D del testo
// e una seconda copia colorata accent, sovrapposta e "ritagliata" da uno
// spotlight radiale che segue il cursore — l'effetto luce-che-scopre-colore
// resta la reazione principale, il tilt è solo un accento in più. Con
// prefers-reduced-motion niente listener, resta il solo testo statico.
export function HeroHeadline({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const spotlightX = useMotionValue(50);
  const spotlightY = useMotionValue(50);

  const tiltSpring = { damping: 20, stiffness: 150, mass: 0.5 };
  const tiltX = useSpring(rawTiltX, tiltSpring);
  const tiltY = useSpring(rawTiltY, tiltSpring);
  const spotX = useSpring(spotlightX, { damping: 24, stiffness: 120 });
  const spotY = useSpring(spotlightY, { damping: 24, stiffness: 120 });

  const maskImage = useMotionTemplate`radial-gradient(220px circle at ${spotX}% ${spotY}%, black, transparent 75%)`;

  if (reduceMotion) {
    return <h1 className="font-sans max-w-xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">{text}</h1>;
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    // Tilt contenuto (max ~6deg): il centro del riquadro è il punto di
    // riposo, gli estremi il massimo scostamento.
    rawTiltY.set((px - 0.5) * 12);
    rawTiltX.set((0.5 - py) * 12);
    spotlightX.set(px * 100);
    spotlightY.set(py * 100);
  }

  function handlePointerLeave() {
    rawTiltX.set(0);
    rawTiltY.set(0);
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative max-w-xl [perspective:800px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.h1
        className="font-sans text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
        style={{ rotateX: tiltX, rotateY: tiltY }}
      >
        {text}
      </motion.h1>
      <motion.h1
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 font-sans text-5xl font-bold leading-[1.1] tracking-tight text-accent sm:text-6xl"
        style={{ rotateX: tiltX, rotateY: tiltY, WebkitMaskImage: maskImage, maskImage }}
      >
        {text}
      </motion.h1>
    </motion.div>
  );
}

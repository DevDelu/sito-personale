"use client";

import { useEffect, useState } from "react";
import { motion, type PanInfo } from "motion/react";

// Oltre questa distanza (px) o con un flick abbastanza veloce, trascinare
// verso il basso chiude il bottom sheet come farebbe un'app nativa.
const CHIUDI_OFFSET_PX = 120;
const CHIUDI_VELOCITY = 600;

// Shell condivisa da tutti i modali dell'area privata: su schermo stretto e
// touch eredita da .modal-overlay/.modal-panel (app/globals.css) l'aspetto
// di bottom sheet (grabber, angoli smussati solo in alto, safe-area), qui
// aggiunge trascinamento per chiudere, blocco scroll del body e chiusura con
// Esc. Su desktop resta un modale centrato, senza trascinamento.
// posizione="alto": su mobile scende dall'alto e si chiude trascinando verso
// l'alto — per sheet con tastiera aperta subito (vedi app/globals.css).
// `area` (obbligatoria) e `entita` finiscono su data-fb-area/data-fb-entita
// del pannello: il feedback aperto sopra questo sheet sa dov'era Lorenzo
// (vedi lib/feedback/aree.ts).
export function Sheet({
  onClose,
  children,
  className = "",
  posizione = "basso",
  area,
  entita,
}: {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  posizione?: "basso" | "alto";
  area: string;
  entita?: string;
}) {
  const alto = posizione === "alto";
  const [trascinabile, setTrascinabile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px) and (pointer: coarse)");
    const sync = () => setTrascinabile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={`modal-overlay ${alto ? "modal-overlay--alto" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className={`modal-panel w-full max-w-md ${alto ? "modal-panel--alto" : ""} ${className}`}
        data-fb-area={area}
        data-fb-entita={entita}
        drag={trascinabile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={alto ? { top: 0.5, bottom: 0 } : { top: 0, bottom: 0.5 }}
        onDragEnd={(_e, info: PanInfo) => {
          const verso = alto ? -1 : 1;
          if (info.offset.y * verso > CHIUDI_OFFSET_PX || info.velocity.y * verso > CHIUDI_VELOCITY) onClose();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

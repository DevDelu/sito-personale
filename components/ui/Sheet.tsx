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
export function Sheet({
  onClose,
  children,
  className = "",
}: {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
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
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className={`modal-panel w-full max-w-md ${className}`}
        drag={trascinabile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_e, info: PanInfo) => {
          if (info.offset.y > CHIUDI_OFFSET_PX || info.velocity.y > CHIUDI_VELOCITY) onClose();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

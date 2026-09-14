"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Overlay fotocamera per la scansione di un barcode EAN/UPC, usato solo
// nella creazione inline di un alimento nel catalogo (vedi AlimentoSelector)
// — mai durante il logging del pasto stesso. Decodifica lato client:
// Barcode Detector API nativa dove disponibile (Chrome/Android, zero
// librerie), fallback a ZXing-js per i browser senza supporto nativo (in
// particolare Safari/iOS).
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const rilevatoRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    let rafId: number | null = null;
    let zxingControls: { stop: () => void } | null = null;

    function segnalaRilevato(barcode: string) {
      if (cancelled || rilevatoRef.current) return;
      rilevatoRef.current = true;
      onDetected(barcode);
    }

    async function avvia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        if (!cancelled) {
          setErrore("Permesso fotocamera negato o fotocamera non disponibile. Puoi comunque inserire l'alimento a mano.");
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
      } }).BarcodeDetector;

      if (BarcodeDetectorCtor) {
        const detector = new BarcodeDetectorCtor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        const loop = async () => {
          if (cancelled) return;
          try {
            const codici = await detector.detect(video);
            if (codici.length > 0) {
              segnalaRilevato(codici[0].rawValue);
              return;
            }
          } catch {
            // frame non decodificabile, si riprova al prossimo tick
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } else {
        try {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromVideoElement(video, (result) => {
            if (result) segnalaRilevato(result.getText());
          });
        } catch {
          if (!cancelled) setErrore("Scansione non supportata su questo browser. Puoi comunque inserire l'alimento a mano.");
        }
      }
    }

    avvia();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="modal-overlay">
      <div className="modal-panel flex w-full max-w-md flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Cerca da barcode</h2>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="btn-icon">
            <X className="h-4 w-4" />
          </button>
        </div>

        {errore ? (
          <p className="text-sm text-spesa" role="alert">
            {errore}
          </p>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-accent" />
          </div>
        )}

        <p className="text-xs text-muted">
          Inquadra il codice a barre del prodotto (EAN/UPC). La scansione avviene sul dispositivo, nessuna immagine
          viene salvata o inviata.
        </p>

        <button type="button" onClick={onClose} className="btn-secondary self-start">
          Annulla
        </button>
      </div>
    </div>
  );
}

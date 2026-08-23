// Tema chiaro dedicato per il portfolio pubblico: scelta voluta, indipendente
// dal tema scuro/chiaro del resto del sito (Bussola). La classe progetti-theme
// (app/globals.css) fissa i token colore ai valori light per tutto questo
// sottoalbero, così i componenti figli possono usare le utility bg-surface/
// text-muted/ecc. senza seguire il toggle dark/light globale.
export default function ProgettiLayout({ children }: { children: React.ReactNode }) {
  return <div className="progetti-theme min-h-screen bg-background font-sans text-foreground">{children}</div>;
}

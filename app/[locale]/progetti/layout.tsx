// Tema chiaro dedicato per il portfolio pubblico: scelta voluta, indipendente
// dal tema scuro/chiaro del resto del sito (Bussola).
export default function ProgettiLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FAF6EC] font-sans text-[#221f19]">{children}</div>;
}

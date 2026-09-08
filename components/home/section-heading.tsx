// Barretta verticale colorata accanto al titolo vero e proprio della
// sezione — non più una piccola label uppercase separata sopra il titolo:
// il titolo grande è già il nome della sezione, non serve ripeterlo più
// piccolo sopra.
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-6 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <h2 className="font-sans text-2xl font-bold tracking-tight">{children}</h2>
    </div>
  );
}

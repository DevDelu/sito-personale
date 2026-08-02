import Image from "next/image";
import { hueFromName } from "@/lib/carte/format";

const POSITION_CLASS = /\b(static|fixed|absolute|relative|sticky)\b/;

// Gradiente con hue derivato dal nome come segnaposto stabile finché una
// carta non ha un'immagine — stessa carta = sempre stesso colore. Quando
// image_url è valorizzato, next/image la mostra con object-fit: cover.
export function CardPlaceholder({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl: string | null;
  className?: string;
}) {
  if (imageUrl) {
    // `fill` richiede un contenitore non-statico: se className non ne passa
    // già uno (es. "absolute inset-0" dei chiamanti in overlay), aggiungiamo
    // "relative" di default.
    const needsRelative = !POSITION_CLASS.test(className ?? "");
    return (
      <div className={`${needsRelative ? "relative " : ""}overflow-hidden ${className ?? ""}`}>
        <Image src={imageUrl} alt={name} fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover" />
      </div>
    );
  }

  const hue = hueFromName(name);
  return (
    <div
      className={className}
      style={{
        background: `radial-gradient(circle at 30% 20%, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 60% 20%))`,
      }}
    />
  );
}

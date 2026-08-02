import { hueFromName } from "@/lib/carte/format";

// Finché non importiamo gli image_url reali (task manuale futuro, carta per
// carta), un gradiente con hue derivato dal nome fa da segnaposto stabile —
// stessa carta = sempre stesso colore. Quando image_url è valorizzato, il
// chiamante può passarlo e non cambia nient'altro nella UI.
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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={name} className={`object-cover ${className ?? ""}`} />;
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

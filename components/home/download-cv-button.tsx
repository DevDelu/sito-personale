"use client";

// L'attributo HTML `download` su un <a> non è affidabile ovunque (in
// particolare Safari tende ad aprire il PDF nel visualizzatore invece di
// scaricarlo). Scaricare il file come blob e forzare il salvataggio via un
// link temporaneo funziona in modo molto più consistente tra i browser.
export function DownloadCvButton({
  href,
  filename,
  label,
  className,
}: {
  href: string;
  filename: string;
  label: string;
  className?: string;
}) {
  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(`Download fallito: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {label}
    </a>
  );
}

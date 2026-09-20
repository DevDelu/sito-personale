"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Gruppo di righe in stile "lista raggruppata" iOS (Impostazioni, Salute):
// card con raggio app-card-radius, senza bordo visibile in scuro, hairline
// interni con rientro invece di bordi per riga.
export function ListGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {title && <h2 className="app-static px-1 text-[13px] font-medium text-muted uppercase">{title}</h2>}
      <div
        className="divide-y divide-[var(--app-hairline)] overflow-hidden rounded-[var(--app-card-radius)] bg-surface [&>*]:pl-4"
        style={{ borderRadius: "var(--app-card-radius)" }}
      >
        {children}
      </div>
    </div>
  );
}

type ListRowBaseProps = {
  icon?: React.ReactNode;
  dot?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
};

function ListRowContent({ icon, dot, title, subtitle, value, chevron, destructive }: ListRowBaseProps) {
  return (
    <>
      {icon && <span className="app-static flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>}
      {dot && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center py-2">
        <span className={`truncate text-[17px] ${destructive ? "text-spesa" : "text-foreground"}`}>
          {title}
        </span>
        {subtitle && <span className="truncate text-[13px] text-muted">{subtitle}</span>}
      </span>
      {value && <span className="font-figures shrink-0 text-[15px] text-muted">{value}</span>}
      {chevron && <ChevronRight className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />}
    </>
  );
}

// Riga cliccabile (navigazione): usa Link.
export function ListRowLink({
  href,
  ...props
}: ListRowBaseProps & { href: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[56px] items-center gap-3 pr-4 transition-colors duration-150 ease-out active:bg-surface-hover"
    >
      <ListRowContent {...props} />
    </Link>
  );
}

// Riga cliccabile (azione locale, es. apre uno sheet): usa button.
export function ListRowButton({
  onClick,
  ...props
}: ListRowBaseProps & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center gap-3 pr-4 text-left transition-colors duration-150 ease-out active:bg-surface-hover"
    >
      <ListRowContent {...props} />
    </button>
  );
}

// Riga non interattiva, con eventuale slot a destra (checkbox, toggle...).
export function ListRow({
  trailing,
  ...props
}: ListRowBaseProps & { trailing?: React.ReactNode }) {
  return (
    <div className="flex min-h-[56px] items-center gap-3 pr-4">
      <ListRowContent {...props} />
      {trailing}
    </div>
  );
}

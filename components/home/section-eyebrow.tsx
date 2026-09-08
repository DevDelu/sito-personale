export function SectionEyebrow({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="h-3 w-[3px] bg-accent" aria-hidden="true" />
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {children}
      </span>
    </div>
  );
}

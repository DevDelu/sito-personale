// Mostrato istantaneamente da Next.js ad ogni navigazione nell'area privata
// mentre la pagina successiva fa le sue query lato server (vedi
// requireUser()/query in ogni page.tsx, che bloccano il render finché non
// finiscono): senza questo file il click su un link della sidebar/tab bar
// non dava alcun feedback fino al termine del fetch, sembrando bloccato.
export default function PrivateLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-7 w-40 animate-pulse rounded-md bg-surface-hover" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl bg-surface-hover" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-hover" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-surface-hover" />
      <div className="flex flex-col gap-2">
        <div className="h-12 animate-pulse rounded-lg bg-surface-hover" />
        <div className="h-12 animate-pulse rounded-lg bg-surface-hover" />
        <div className="h-12 animate-pulse rounded-lg bg-surface-hover" />
      </div>
    </div>
  );
}

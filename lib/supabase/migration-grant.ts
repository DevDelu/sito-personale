// Controllo sulle migration: dal 2026 Supabase non espone più in automatico
// le tabelle nuove ai ruoli API (changelog 45329). Senza un GRANT esplicito
// la richiesta fallisce con 42501 "permission denied" anche con RLS giusta.
// Una migration numerata da 036 in poi che crea una tabella deve quindi
// contenere un `grant ... on <tabella> to ...`. Puro, testabile con node:test.

export const PRIMA_MIGRATION_CON_GRANT = 36;

export function numeroMigration(nomeFile: string): number | null {
  const m = /^(\d{3})_/.exec(nomeFile);
  return m ? Number(m[1]) : null;
}

function tabelleCreate(sql: string): string[] {
  const senzaCommenti = sql.replace(/--.*$/gm, "");
  const trovate: string[] = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi;
  for (let m = re.exec(senzaCommenti); m; m = re.exec(senzaCommenti)) trovate.push(m[1].toLowerCase());
  return trovate;
}

export function tabelleSenzaGrant(sql: string): string[] {
  const senzaCommenti = sql.replace(/--.*$/gm, "").toLowerCase();
  return tabelleCreate(sql).filter((t) => {
    const re = new RegExp(`grant\\s[^;]*\\bon\\s+(?:table\\s+)?(?:public\\.)?"?${t}"?\\b`);
    return !re.test(senzaCommenti);
  });
}

-- Migrazione 029: template "jolly" (non legati a un giorno fisso) per
-- template_pasti, come da spec originale del modulo Template settimanale
-- (027/028) — non implementati finora, deliberatamente rimandati.
-- Esegui DOPO 001-028 nell'SQL editor di Supabase.
--
-- `giorno_settimana` diventa nullable: null = template jolly, selezionabile
-- manualmente dal quick-add come alternativa veloce alla cella del giorno
-- corrente (es. panino da lavoro nei giorni di fretta), invece di essere
-- agganciato a una cella fissa della griglia 7×4.
--
-- L'unique index precedente (un solo template per cella giorno×tipo_pasto)
-- va ristretto ai soli template non-jolly: più jolly con lo stesso
-- tipo_pasto sono ammessi (sono alternative tra cui scegliere, non celle
-- uniche di una griglia).

alter table template_pasti alter column giorno_settimana drop not null;

drop index if exists template_pasti_giorno_tipo_idx;
create unique index template_pasti_giorno_tipo_idx
  on template_pasti (giorno_settimana, tipo_pasto)
  where giorno_settimana is not null;

-- Alimenti mancanti per il jolly seminato sotto (stessa logica di 027/028:
-- insert solo se il nome non esiste già).
insert into alimenti (nome, kcal_100g, proteine_100g, carboidrati_100g, grassi_100g) values
  ('Tacchino (fesa)', 104, 22, 0, 1.5)
on conflict (nome) do nothing;

-- Jolly di esempio dalla spec: "Panino da lavoro" — pane integrale 180g +
-- tacchino 120g + insalata 50g (~670 kcal, 46g P, 84g C, 7g F). tipo_pasto
-- 'pranzo' perché è l'uso tipico (sostituto veloce del pranzo nei giorni di
-- fretta), ma resta selezionabile dal quick-add per qualsiasi pasto.
-- Guardia manuale (non un vincolo unique, i jolly possono ripetersi per
-- tipo_pasto): evita il doppione se la migrazione viene rieseguita.
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note)
select null, 'pranzo', 'Panino da lavoro',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 180),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Tacchino (fesa)'), 'quantita_g', 120),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 50)
  ),
  'Jolly — alternativa veloce, selezionabile manualmente dal quick-add nei giorni di fretta'
where not exists (
  select 1 from template_pasti where giorno_settimana is null and nome = 'Panino da lavoro'
);

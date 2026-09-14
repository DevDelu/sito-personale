-- Migrazione 027: Template settimanale pasti (Alimentazione, Fase B).
-- Esegui DOPO 001-026 nell'SQL editor di Supabase.
--
-- Nota su RLS/user_id: stessa convenzione di tutte le altre tabelle del
-- progetto (vedi il commento esteso in 026_alimentazione.sql, che a sua
-- volta rimanda a spese/investimenti/carte/allenamento/agenda) — nessuna
-- colonna `user_id`, nessuna policy per anon/authenticated: RLS abilitata e
-- default-deny, accesso solo lato server con `createAdminClient()` a valle
-- di requireUser()/isOwner(). L'unica eccezione del progetto resta
-- quiz_attempts/profiles (025_quiz.sql), l'unica funzionalità realmente
-- multi-utente.
--
-- Nota sui grammi seminati: la spec originale di questa funzionalità fa
-- riferimento a due file esterni con le grammature esatte del piano di
-- Lorenzo ("pasti-settimanali-grammi.md" e "piano_settimanale_12_mesi.xlsx"),
-- non disponibili in questa sessione. Le quantità inserite qui sotto sono
-- PLACEHOLDER — porzioni tipiche plausibili, non i valori reali del piano —
-- e vanno confermate/corrette da Lorenzo dalla UI del template
-- (/alimentazione/template) prima di fare affidamento sul punteggio di
-- aderenza. Ogni riga seminata ha `note` valorizzato di conseguenza. Anche
-- la composizione della colazione (yogurt greco + avena + latte di soia +
-- creatina, confermata nella spec per tutti e 7 i giorni) ha le grammature
-- di avena e latte di soia da verificare con Lorenzo, come indicato nella
-- spec stessa.

create table template_pasti (
  id uuid primary key default gen_random_uuid(),
  giorno_settimana smallint not null check (giorno_settimana between 1 and 7), -- 1 = lunedì
  tipo_pasto text not null check (tipo_pasto in ('colazione', 'pranzo', 'cena', 'spuntino')),
  nome text not null,
  composizione jsonb not null default '[]'::jsonb, -- [{ alimento_id: uuid, quantita_g: number }]
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un solo template per cella giorno×tipo_pasto (griglia 7×4, 28 celle max).
create unique index template_pasti_giorno_tipo_idx on template_pasti (giorno_settimana, tipo_pasto);

alter table template_pasti enable row level security;

-- Nessuna policy per anon/authenticated (vedi nota RLS/user_id in cima al
-- file): RLS abilitata e default-deny, accesso solo dal server con la
-- service role key.

-- Aderenza al piano: calcolata lato TypeScript in lib/alimentazione/template.ts
-- (stesso principio di getRiepilogoTdee/trendSettimanale in
-- lib/alimentazione/queries.ts, vedi commento in 026_alimentazione.sql) —
-- nessuna vista SQL qui, il confronto template↔pasti reali richiede più di
-- un semplice join.

-- Catalogo alimenti usato dai template seminati sotto: inserisce solo gli
-- alimenti mancanti (on conflict su `nome`, vedi vincolo unique in
-- 026_alimentazione.sql), senza toccare eventuali alimenti già presenti con
-- lo stesso nome. Valori kcal/macro per 100g sono stime ragionevoli da fonti
-- nutrizionali generiche, editabili in qualsiasi momento dal catalogo (come
-- ogni altro alimento) — non sono valori certificati del piano di Lorenzo.
insert into alimenti (nome, kcal_100g, proteine_100g, carboidrati_100g, grassi_100g) values
  ('Yogurt greco', 59, 10, 3.6, 0.4),
  ('Avena', 389, 16.9, 66.3, 6.9),
  ('Latte di soia', 33, 3.3, 1.8, 1.8),
  ('Creatina', 0, 0, 0, 0),
  ('Riso', 130, 2.7, 28, 0.3),
  ('Pollo', 165, 31, 0, 3.6),
  ('Zucchine', 17, 1.2, 3.1, 0.3),
  ('Patate', 87, 1.9, 20, 0.1),
  ('Merluzzo', 82, 18, 0, 0.7),
  ('Insalata mista', 15, 1.4, 2.9, 0.2),
  ('Ceci', 164, 8.9, 27.4, 2.6),
  ('Pasta integrale', 124, 5.3, 25, 0.9),
  ('Tonno', 116, 25.5, 0, 1),
  ('Spinaci', 23, 2.9, 3.6, 0.4),
  ('Uova', 143, 12.6, 0.7, 9.5),
  ('Lenticchie', 116, 9, 20.1, 0.4),
  ('Fette biscottate', 408, 10, 76, 7),
  ('Miele', 304, 0.3, 82.4, 0),
  ('Carote', 41, 0.9, 9.6, 0.2),
  ('Frutta fresca', 52, 0.3, 14, 0.2)
on conflict (nome) do nothing;

-- Colazione: stessa composizione confermata per tutti e 7 i giorni. Grammi
-- di avena e latte di soia PLACEHOLDER (vedi nota in cima al file).
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note)
select g, 'colazione', 'Yogurt greco + avena + latte di soia + creatina',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Avena'), 'quantita_g', 50),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Latte di soia'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Creatina'), 'quantita_g', 5)
  ),
  'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo (avena e latte di soia in particolare, ancora da verificare rispetto al piano originale)'
from generate_series(1, 7) as g
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Pranzo/cena/spuntino, giorno per giorno.

-- Lunedì (1)
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(1, 'pranzo', 'Riso + pollo + zucchine',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pollo'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Zucchine'), 'quantita_g', 150)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(1, 'cena', 'Patate + merluzzo + insalata',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 250),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Merluzzo'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 80)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(1, 'spuntino', 'Yogurt greco',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 125)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Martedì (2)
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(2, 'pranzo', 'Riso + pollo + zucchine',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pollo'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Zucchine'), 'quantita_g', 150)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(2, 'cena', 'Patate + ceci + insalata',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Ceci'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 80)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(2, 'spuntino', 'Frutta fresca',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Frutta fresca'), 'quantita_g', 150)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Mercoledì (3)
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(3, 'pranzo', 'Pasta integrale + tonno + spinaci',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pasta integrale'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Tonno'), 'quantita_g', 80),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Spinaci'), 'quantita_g', 100)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(3, 'cena', 'Uova + verdure',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Uova'), 'quantita_g', 120),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 100)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(3, 'spuntino', 'Yogurt greco',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 125)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Giovedì (4)
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(4, 'pranzo', 'Pasta integrale + tonno + spinaci',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pasta integrale'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Tonno'), 'quantita_g', 80),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Spinaci'), 'quantita_g', 100)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(4, 'cena', 'Patate + lenticchie + insalata',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Lenticchie'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 80)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(4, 'spuntino', 'Fette biscottate + miele',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Fette biscottate'), 'quantita_g', 40),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Miele'), 'quantita_g', 20)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Venerdì (5)
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(5, 'pranzo', 'Riso + uova sode + carote',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Uova'), 'quantita_g', 120),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Carote'), 'quantita_g', 100)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(5, 'cena', 'Patate + merluzzo + insalata',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 250),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Merluzzo'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 80)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(5, 'spuntino', 'Frutta fresca',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Frutta fresca'), 'quantita_g', 150)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Sabato (6)
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(6, 'pranzo', 'Riso + pollo + zucchine',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pollo'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Zucchine'), 'quantita_g', 150)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(6, 'cena', 'Uova + verdure',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Uova'), 'quantita_g', 120),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 100)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(6, 'spuntino', 'Yogurt greco',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 125)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Domenica (7): pranzo libero/avanzi, nessuna composizione fissa da seminare.
insert into template_pasti (giorno_settimana, tipo_pasto, nome, composizione, note) values
(7, 'pranzo', 'Libero / avanzi', '[]'::jsonb, 'pasto libero, nessun template fisso'),
(7, 'cena', 'Patate + ceci + insalata',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Ceci'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 80)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo'),
(7, 'spuntino', 'Frutta fresca',
  jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Frutta fresca'), 'quantita_g', 150)
  ), 'Quantità di partenza stimate — da confermare/aggiustare da Lorenzo')
on conflict (giorno_settimana, tipo_pasto) do nothing;

-- Fuori scope (vedi spec): generazione lista della spesa, notifiche/promemoria
-- collegati ai template, scaling automatico delle quantità per fase
-- dell'obiettivo nutrizionale — quantità fisse, editabili manualmente dalla
-- griglia UI.

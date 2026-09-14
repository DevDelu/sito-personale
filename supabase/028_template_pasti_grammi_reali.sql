-- Migrazione 028: grammature reali Fase 1 (Costruzione, ~2870 kcal/die) per
-- template_pasti, in sostituzione dei placeholder seminati in
-- 027_template_pasti.sql.
-- Esegui DOPO 001-027 nell'SQL editor di Supabase.
--
-- Dati confermati da Lorenzo (piano nutrizionale Fase 1 su 12 mesi, 73kg
-- 176cm 26 anni M, target 2870 kcal · 140g proteine · 402g carbo · 78g
-- grassi/die). Le righe seminate qui aggiornano SOLO composizione/note dei
-- template esistenti (nessun nuovo insert in template_pasti, la griglia
-- 7x4 resta quella di 027 grazie all'unique index su
-- giorno_settimana/tipo_pasto) — non tocca i pasti già registrati in
-- `pasti` (snapshot storico, vedi 026_alimentazione.sql).
--
-- Lo spuntino di domenica non è specificato nel piano Fase 1 fornito
-- (la tabella del piano copre solo pranzo/cena per domenica) e resta quindi
-- il placeholder di 027 ("Frutta fresca", 150g) — da confermare/correggere
-- come le altre righe placeholder eventualmente rimaste.
--
-- Alternative "jolly" del piano (panino da lavoro, cena veloce con uova,
-- hummus+verdure, avocado, salmone affumicato) NON sono seminate come righe
-- griglia: la griglia resta un template fisso per cella giorno×pasto (per
-- design, vedi 027), le alternative sono materiale di riferimento che
-- Lorenzo può impostare manualmente sostituendo una cella dalla UI se le
-- usa stabilmente al posto della base.

-- Alimenti mancanti nel catalogo per le grammature reali (stessa logica di
-- 027: insert solo se il nome non esiste già, valori kcal/macro per 100g
-- stime nutrizionali generiche, editabili come ogni altro alimento).
insert into alimenti (nome, kcal_100g, proteine_100g, carboidrati_100g, grassi_100g) values
  ('Pane integrale', 247, 9, 41, 3.4),
  ('Olio EVO', 884, 0, 0, 100),
  ('Mela/pera', 52, 0.3, 14, 0.2),
  ('Verdure miste', 25, 2, 4, 0.3)
on conflict (nome) do nothing;

-- Colazione (fissa tutti i giorni): avena e latte di soia ora ai grammi
-- confermati (65g / 250g) al posto del placeholder di 027.
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Avena'), 'quantita_g', 65),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Latte di soia'), 'quantita_g', 250),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Creatina'), 'quantita_g', 5)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where tipo_pasto = 'colazione';

-- Lunedì (1)
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 220)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 1 and tipo_pasto = 'spuntino';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 220),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pollo'), 'quantita_g', 215),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Zucchine'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 20)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 1 and tipo_pasto = 'pranzo';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 450),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 60),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Merluzzo'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 1 and tipo_pasto = 'cena';

-- Martedì (2)
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Mela/pera'), 'quantita_g', 150)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 2 and tipo_pasto = 'spuntino';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 210),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pollo'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Zucchine'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 2 and tipo_pasto = 'pranzo';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 300),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 50),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Ceci'), 'quantita_g', 220),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 2 and tipo_pasto = 'cena';

-- Mercoledì (3)
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 200)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 3 and tipo_pasto = 'spuntino';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pasta integrale'), 'quantita_g', 180),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Tonno'), 'quantita_g', 130),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Spinaci'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 3 and tipo_pasto = 'pranzo';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Uova'), 'quantita_g', 180),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Verdure miste'), 'quantita_g', 250),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 3 and tipo_pasto = 'cena';

-- Giovedì (4)
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 40),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Miele'), 'quantita_g', 20)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 4 and tipo_pasto = 'spuntino';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pasta integrale'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Tonno'), 'quantita_g', 160),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Spinaci'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 4 and tipo_pasto = 'pranzo';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 420),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 40),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Lenticchie'), 'quantita_g', 170),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 4 and tipo_pasto = 'cena';

-- Venerdì (5)
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Mela/pera'), 'quantita_g', 250)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 5 and tipo_pasto = 'spuntino';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 210),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Uova'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Carote'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 5 and tipo_pasto = 'pranzo';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 450),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 30),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Merluzzo'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 5 and tipo_pasto = 'cena';

-- Sabato (6)
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Yogurt greco'), 'quantita_g', 200)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 6 and tipo_pasto = 'spuntino';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Riso'), 'quantita_g', 190),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pollo'), 'quantita_g', 110),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Zucchine'), 'quantita_g', 200),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 6 and tipo_pasto = 'pranzo';

update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Uova'), 'quantita_g', 160),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Verdure miste'), 'quantita_g', 250),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 6 and tipo_pasto = 'cena';

-- Domenica (7): pranzo resta libero/avanzi (invariato), cena ai grammi
-- confermati. Spuntino non specificato nel piano: resta il placeholder di
-- 027 (Frutta fresca 150g).
update template_pasti set
  composizione = jsonb_build_array(
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Patate'), 'quantita_g', 300),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Pane integrale'), 'quantita_g', 50),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Ceci'), 'quantita_g', 220),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Insalata mista'), 'quantita_g', 150),
    jsonb_build_object('alimento_id', (select id from alimenti where nome = 'Olio EVO'), 'quantita_g', 15)
  ),
  note = 'Grammature esatte — piano Fase 1 (Costruzione), confermato da Lorenzo',
  updated_at = now()
where giorno_settimana = 7 and tipo_pasto = 'cena';

update template_pasti set
  note = 'Pranzo libero/avanzi — punta a ~1000-1100 kcal, 30-40g proteine per restare in linea con il target settimanale (piano Fase 1)',
  updated_at = now()
where giorno_settimana = 7 and tipo_pasto = 'pranzo';

-- Migrazione 005: colore categorie per i grafici, split Overview/Gestione.
-- Esegui DOPO 001-004 nell'SQL editor di Supabase.

-- Popola categorie.colore con un riferimento a variabile CSS (non un hex
-- fisso): il colore resta così coerente tra light/dark mode e con i badge
-- categoria già usati altrove nell'app (vedi lib/category-style.ts), pur
-- diventando leggibile direttamente dalla tabella per i grafici.
update categorie set colore = 'var(--cat-alimentari)' where nome = 'Alimentari' and tipo = 'spesa';
update categorie set colore = 'var(--cat-benzina)' where nome = 'Benzina' and tipo = 'spesa';
update categorie set colore = 'var(--cat-vinted)' where nome = 'Vinted' and tipo = 'spesa';
update categorie set colore = 'var(--cat-paypal)' where nome = 'PayPal' and tipo = 'spesa';
update categorie set colore = 'var(--cat-bonifici)' where nome = 'Bonifici' and tipo = 'spesa';
update categorie set colore = 'var(--cat-ristoranti)' where nome = 'Ristoranti' and tipo = 'spesa';
update categorie set colore = 'var(--cat-altro)' where nome = 'Altro' and tipo = 'spesa';
update categorie set colore = 'var(--cat-stipendio)' where nome = 'Stipendio' and tipo = 'entrata';
update categorie set colore = 'var(--cat-rimborso)' where nome = 'Rimborso' and tipo = 'entrata';
update categorie set colore = 'var(--cat-vinted)' where nome = 'Vinted' and tipo = 'entrata';
update categorie set colore = 'var(--cat-bonifici)' where nome = 'Bonifici' and tipo = 'entrata';
update categorie set colore = 'var(--cat-altro)' where nome = 'Altro' and tipo = 'entrata';

-- View unificata per la pagina Gestione: ricerca/filtro/paginazione nativi
-- via PostgREST su un'unica risorsa invece di unire spese+depositi in JS.
-- Sola lettura: le modifiche restano dirette su spese/depositi per id+tipo.
drop view if exists movimenti_con_categoria;
create view movimenti_con_categoria as
select
  s.id,
  'spesa' as tipo,
  s.data,
  s.importo,
  s.titolo,
  s.descrizione,
  s.categoria_id,
  s.nominativo,
  s.dettaglio,
  s.fonte,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from spese s
left join categorie c on c.id = s.categoria_id
union all
select
  d.id,
  'entrata' as tipo,
  d.data,
  d.importo,
  d.titolo,
  d.descrizione,
  d.categoria_id,
  d.nominativo,
  d.dettaglio,
  d.fonte,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from depositi d
left join categorie c on c.id = d.categoria_id;

-- NOTA su RLS (nessuna modifica qui): le tabelle spese/depositi/categorie
-- hanno RLS abilitata ma senza policy per anon/authenticated (comportamento
-- voluto fin dallo schema iniziale). L'app legge e scrive sempre lato
-- server con la service role key, che bypassa RLS per definizione in
-- Postgres/Supabase — quindi update/delete dalla pagina Gestione
-- funzionano già senza bisogno di policy aggiuntive. RLS resta comunque
-- utile come rete di sicurezza contro un eventuale accesso diretto con la
-- chiave pubblica, che l'app non usa mai per leggere/scrivere dati.

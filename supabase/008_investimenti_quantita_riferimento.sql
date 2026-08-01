-- Migrazione 008: quantità di riferimento manuale per posizioni con storico
-- transazioni incompleto (es. ETF comprati prima di avere un tracciamento
-- puntuale, ETC oro senza storico transazioni disponibile).
-- Esegui DOPO 007 nell'SQL editor di Supabase.
--
-- Usata SOLO per il valore di mercato attuale mostrato in Overview
-- (quantita_riferimento_manuale × prezzo corrente). Costo medio di carico e
-- plusvalenza restano calcolati esclusivamente sulle transazioni verificate
-- in `transazioni` (mai su questo campo), e vengono etichettati come
-- "parziali" in UI quando questo campo è valorizzato e diverge dalla
-- quantità netta calcolata da FIFO.

alter table assets add column if not exists quantita_riferimento_manuale numeric;

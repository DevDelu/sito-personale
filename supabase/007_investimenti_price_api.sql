-- Migrazione 007: mapping asset -> simbolo per l'aggiornamento prezzi.
-- Esegui DOPO 006 nell'SQL editor di Supabase.
--
-- Il ticker esistente su `assets` resta l'etichetta interna mostrata in UI
-- (es. "SX5E", "NDXE") e non coincide col simbolo usato dalla fonte prezzi:
-- per gli ETF/ETC si usa il ticker Yahoo Finance con suffisso di borsa
-- (endpoint chart non ufficiale, gratuito, nessuna chiave richiesta), per
-- Bitcoin l'id CoinGecko. Verificato manualmente per ISIN: per l'Euro
-- Stoxx 50 il fondo reale è "Amundi EURO STOXX 50 II" (MSE.PA), per il
-- Nasdaq 100 è "Amundi Core Nasdaq-100" (UST.PA, rinominato da Lyxor).

alter table assets add column if not exists price_symbol text;
alter table assets add column if not exists coingecko_id text;

update assets set price_symbol = 'SGLD.MI' where ticker = 'SGLD';
update assets set price_symbol = 'MWEQ.DE' where ticker = 'MWEQ';
update assets set price_symbol = 'MSE.PA' where ticker = 'SX5E';
update assets set price_symbol = 'UST.PA' where ticker = 'NDXE';
update assets set coingecko_id = 'bitcoin' where ticker = 'BTC';

-- La fonte 'yahoo' (ETF/ETC) si aggiunge a quelle già ammesse in 006.
alter table prezzi_storico drop constraint if exists prezzi_storico_fonte_check;
alter table prezzi_storico add constraint prezzi_storico_fonte_check
  check (fonte in ('twelvedata', 'coingecko', 'manuale', 'yahoo'));

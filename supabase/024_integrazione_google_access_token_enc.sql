-- Migrazione 024: cifra l'access token Google (coerenza col refresh token).
-- Esegui DOPO 001-023 nell'SQL editor di Supabase.
--
-- `refresh_token_enc` è già cifrato con AES-256-GCM (lib/agenda/crypto.ts).
-- `access_token` invece veniva scritto in chiaro: stesso trattamento qui.
-- Nessuna migrazione dati necessaria — il valore in chiaro non è mai stato
-- riletto dal DB per essere usato (sia la sync che la lettura mail derivano
-- un access token fresco da refreshAccessToken() ad ogni chiamata), quindi
-- si può droppare la colonna vecchia senza perdita di funzionalità.

alter table integrazione_google add column access_token_enc text;
alter table integrazione_google drop column access_token;

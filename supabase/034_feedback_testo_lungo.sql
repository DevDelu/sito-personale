-- Migrazione 034: testi dei feedback lunghi (dettatura vocale). Esegui DOPO
-- 033 nell'SQL editor di Supabase.
--
-- 031 limitava il testo a 500 caratteri e 033 le note a 1000: con la
-- dettatura di iPhone un feedback supera facilmente i 500 e il campo lo
-- tagliava. Ora 5000 per entrambi (FEEDBACK_TESTO_MAX / EVENTO_TESTO_MAX in
-- lib/feedback/types.ts).
--
-- Finché questa migration non è applicata l'app non perde nulla: se il
-- vincolo vecchio rifiuta un testo lungo, inserisciFeedback() salva i primi
-- 500 caratteri e il resto come note consecutive (lib/feedback/queries.ts).

alter table feedback drop constraint if exists feedback_testo_check;
alter table feedback add constraint feedback_testo_check check (char_length(testo) between 1 and 5000);

alter table feedback_eventi drop constraint if exists feedback_eventi_testo_check;
alter table feedback_eventi add constraint feedback_eventi_testo_check check (testo is null or char_length(testo) <= 5000);

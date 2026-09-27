-- Migrazione 032: nuova origine 'pulsante' per i feedback (FAB dedicato in
-- Spese, components/feedback/FeedbackAccessi.tsx). Esegui DOPO 031.
--
-- Finché non è applicata l'app non si rompe: POST /api/feedback, se il
-- vincolo rifiuta 'pulsante', salva lo stesso feedback con origine 'tab'.

alter table feedback drop constraint if exists feedback_origine_check;
alter table feedback add constraint feedback_origine_check
  check (origine in ('tab', 'suggerimento', 'altro', 'desktop', 'pulsante'));

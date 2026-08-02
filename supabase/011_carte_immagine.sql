-- Migrazione 011: storage bucket per le immagini delle carte caricate a mano.
-- Esegui DOPO 010 nell'SQL editor di Supabase.
--
-- Il form /carte/nuova ora permette di caricare un'immagine (foto della
-- carta) invece di limitarsi al placeholder a gradiente. image_url su
-- fusion_world_cards esiste già dalla 009: qui creiamo solo il bucket
-- pubblico dove l'app carica i file. L'upload avviene sempre lato server
-- con la service role key (bypassa RLS), quindi non servono policy su
-- storage.objects per l'inserimento — solo il bucket pubblico per servire
-- le immagini in lettura.

insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

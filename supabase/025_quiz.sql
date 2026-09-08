-- Migrazione 025: Quiz AI in homepage (classifica pubblica, login Google).
-- Esegui DOPO 001-024 nell'SQL editor di Supabase.
--
-- Diverso dalle altre tabelle del progetto (private, RLS abilitata SENZA
-- policy, lette/scritte solo lato server con la service role key): qui
-- `profiles` è scritta direttamente dal client autenticato (RLS con
-- `auth.uid() = id`), e la classifica è letta pubblicamente tramite una
-- view. `quiz_questions` e `quiz_attempts` restano invece nella convenzione
-- classica del progetto: RLS abilitata, nessuna policy per anon/authenticated,
-- accesso solo dalle route API che usano la service role key — necessario
-- per non esporre mai `correct_index`/`explain` prima che l'utente risponda,
-- e per non fidarsi mai di un punteggio inviato dal client.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) >= 2),
  created_at timestamptz not null default now()
);

create table quiz_questions (
  id serial primary key,
  category text not null,
  difficulty text not null default 'easy',
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explain text not null,
  created_at timestamptz not null default now()
);

create table quiz_attempts (
  user_id uuid primary key references profiles(id) on delete cascade,
  score int not null,
  time_taken_ms int not null,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

-- profiles: lettura pubblica del nickname (serve alla classifica e ai
-- controlli di disponibilità), scrittura solo da parte del proprietario.
-- Colonna id inclusa nel select per permettere al client di verificare se
-- il proprio profilo esiste già (join implicito lato client su auth.uid()).
revoke all on profiles from anon, authenticated;
grant select (id, nickname) on profiles to anon, authenticated;
grant insert (id, nickname) on profiles to authenticated;
grant update (nickname) on profiles to authenticated;

create policy profiles_select_public on profiles
  for select
  using (true);

create policy profiles_insert_own on profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy profiles_update_own on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- quiz_questions: nessuna policy per anon/authenticated (stessa convenzione
-- delle altre tabelle del progetto) — il client non deve mai poter leggere
-- `correct_index`/`explain` prima di rispondere. Servite solo da
-- app/api/quiz/questions/route.ts (service role key), che le seleziona già
-- senza quelle due colonne.
--
-- quiz_attempts: idem, nessuna policy diretta — mai un insert/update dal
-- client. L'upsert avviene solo in app/api/quiz/submit/route.ts (service
-- role key), che ricalcola il punteggio server-side. La lettura pubblica
-- passa dalla view quiz_leaderboard sotto.

-- Classifica generale, all-time: nickname + punteggio + tempo, mai lo
-- user_id grezzo. `rank` calcolato qui per riuso sia nel teaser (top 5) sia
-- nella classifica completa; i consumer devono comunque ordinare per `rank`
-- esplicitamente, Postgres non garantisce l'ordine senza ORDER BY a monte.
create view quiz_leaderboard as
select
  row_number() over (order by a.score desc, a.time_taken_ms asc) as rank,
  p.nickname,
  a.score,
  a.time_taken_ms,
  a.updated_at
from quiz_attempts a
join profiles p on p.id = a.user_id;

grant select on quiz_leaderboard to anon, authenticated;

-- Estrazione di n domande casuali, usata da GET /api/quiz/questions (service
-- role key): `order by random()` va fatto lato SQL, il query builder di
-- supabase-js non espone un ordinamento per espressione arbitraria.
create or replace function quiz_random_questions(n int)
returns setof quiz_questions
language sql
stable
as $$
  select * from quiz_questions order by random() limit n;
$$;

revoke all on function quiz_random_questions(int) from public;
grant execute on function quiz_random_questions(int) to service_role;

-- Seed: pool di domande (45, 6 categorie, difficoltà 'easy').
insert into quiz_questions (category, difficulty, question, options, correct_index, explain) values
  ('Cos''è l''AI', 'easy', 'Cosa significa l''acronimo "AI"?', '["Intelligenza Artificiale", "Automazione Integrata", "Algoritmo Intelligente", "Interfaccia Automatica"]'::jsonb, 0, 'AI è l''acronimo di Intelligenza Artificiale (Artificial Intelligence), la disciplina informatica che studia sistemi capaci di svolgere compiti che richiedono intelligenza.'),
  ('Cos''è l''AI', 'easy', 'In generale, cosa fa un sistema di intelligenza artificiale?', '["Esegue solo calcoli matematici fissi", "Simula capacità tipicamente umane come riconoscere pattern o prendere decisioni", "Sostituisce sempre completamente l''essere umano", "Funziona solo con dati testuali"]'::jsonb, 1, 'L''AI comprende sistemi che imitano capacità cognitive umane (percezione, ragionamento, decisione), non un singolo tipo di calcolo.'),
  ('Cos''è l''AI', 'easy', 'Qual è la differenza principale tra AI "debole" (narrow AI) e AI "forte" (general AI)?', '["La debole è più lenta", "La debole svolge un compito specifico, la forte avrebbe intelligenza generale come l''uomo", "La forte esiste già ed è usata ovunque", "Non c''è alcuna differenza"]'::jsonb, 1, 'L''AI debole è specializzata in un compito (es. riconoscere immagini), mentre l''AI forte (ancora teorica) avrebbe capacità cognitive generali paragonabili a quelle umane.'),
  ('Cos''è l''AI', 'easy', 'Quale di questi NON è un esempio comune di applicazione AI nella vita quotidiana?', '["Suggerimenti su Netflix o Spotify", "Riconoscimento facciale dello smartphone", "Un tostapane meccanico a molla", "Assistenti vocali come Siri o Alexa"]'::jsonb, 2, 'Il tostapane a molla è un dispositivo puramente meccanico, senza alcun algoritmo che apprende o si adatta.'),
  ('Cos''è l''AI', 'easy', 'Cos''è un "algoritmo"?', '["Un tipo di computer", "Una sequenza di istruzioni per risolvere un problema", "Un linguaggio di programmazione", "Un componente hardware"]'::jsonb, 1, 'Un algoritmo è una sequenza finita e ordinata di passi per risolvere un problema o svolgere un compito, indipendentemente dal linguaggio o dal computer usato.'),
  ('Cos''è l''AI', 'easy', 'Cosa si intende per "dati di addestramento" (training data)?', '["I dati che l''utente inserisce durante l''uso", "L''insieme di esempi usati per far apprendere un modello", "I dati cancellati dopo l''uso", "Solo le immagini usate nei test"]'::jsonb, 1, 'Un modello di AI impara pattern e regolarità analizzando grandi quantità di esempi, chiamati appunto dati di addestramento.'),
  ('Cos''è l''AI', 'easy', 'Cosa distingue l''AI dalla semplice automazione?', '["Nulla, sono sinonimi", "L''AI può adattarsi e imparare da nuovi dati, l''automazione segue regole fisse", "L''automazione è più recente", "L''AI non usa mai il software"]'::jsonb, 1, 'L''automazione classica esegue regole predefinite senza cambiarle, mentre i sistemi di AI possono migliorare o adattare il proprio comportamento in base ai dati.'),
  ('Cos''è l''AI', 'easy', 'Quale disciplina scientifica NON contribuisce tipicamente allo sviluppo dell''AI?', '["Informatica", "Statistica", "Neuroscienze", "Botanica"]'::jsonb, 3, 'L''AI nasce dall''incontro di informatica, matematica/statistica e neuroscienze; la botanica non è tra le sue discipline fondanti.'),
  ('Machine Learning', 'easy', 'Cosa significa "Machine Learning"?', '["Programmare manualmente ogni regola", "Far apprendere ai sistemi dai dati senza istruzioni esplicite per ogni caso", "Un tipo di hardware per computer", "Un linguaggio di programmazione"]'::jsonb, 1, 'Il Machine Learning è un ramo dell''AI in cui i sistemi imparano pattern dai dati invece di seguire regole scritte a mano per ogni situazione.'),
  ('Machine Learning', 'easy', 'Cos''è l''apprendimento "supervisionato"?', '["Un umano supervisiona in tempo reale ogni previsione", "Il modello impara da dati già etichettati con la risposta corretta", "Il modello impara senza alcun dato", "Un tipo di rete neurale specifica"]'::jsonb, 1, 'Nell''apprendimento supervisionato il modello riceve esempi con l''etichetta/risposta corretta già nota, e impara ad associare input e output.'),
  ('Machine Learning', 'easy', 'Cos''è l''apprendimento "non supervisionato"?', '["Il modello trova pattern in dati senza etichette predefinite", "Il modello non impara mai", "È lo stesso dell''apprendimento supervisionato", "Richiede sempre un premio o un punteggio"]'::jsonb, 0, 'Nell''apprendimento non supervisionato non ci sono etichette: il modello cerca da solo strutture o raggruppamenti nascosti nei dati.'),
  ('Machine Learning', 'easy', 'Cos''è una "rete neurale"?', '["Una rete di computer collegati a internet", "Un modello ispirato al funzionamento dei neuroni biologici, con strati di nodi collegati", "Un tipo di database", "Un dispositivo hardware specifico"]'::jsonb, 1, 'Le reti neurali artificiali sono modelli matematici organizzati in strati di ''nodi'' interconnessi, ispirati in modo semplificato al funzionamento dei neuroni del cervello.'),
  ('Machine Learning', 'easy', 'Cosa si intende per "overfitting" in un modello di Machine Learning?', '["Il modello impara troppo bene i dati di addestramento ma generalizza male su dati nuovi", "Il modello è troppo semplice per imparare qualcosa", "Il modello si addestra troppo velocemente", "Il modello usa troppa poca memoria"]'::jsonb, 0, 'L''overfitting avviene quando un modello memorizza troppo i dettagli (anche il ''rumore'') dei dati di addestramento, perdendo la capacità di generalizzare su dati mai visti.'),
  ('Machine Learning', 'easy', 'Cos''è il "Deep Learning"?', '["Uno studio molto approfondito fatto da umani", "Un sottoinsieme del Machine Learning basato su reti neurali con molti strati", "Un sinonimo di AI in generale", "Un metodo che non usa dati"]'::jsonb, 1, 'Il Deep Learning usa reti neurali ''profonde'', cioè con molti strati nascosti, capaci di apprendere rappresentazioni via via più complesse dei dati.'),
  ('Machine Learning', 'easy', 'In quale ambito il Machine Learning ha ottenuto risultati particolarmente noti, come battere campioni umani?', '["Giochi come gli scacchi e il Go", "Cucina", "Giardinaggio", "Sartoria"]'::jsonb, 0, 'Sistemi come AlphaGo (Go) e Deep Blue (scacchi) hanno raggiunto e superato il livello dei migliori giocatori umani grazie a tecniche di AI e Machine Learning.'),
  ('Machine Learning', 'easy', 'Cosa sono le "feature" (caratteristiche) in un modello di Machine Learning?', '["Le funzioni extra di un software", "Le variabili di input usate dal modello per fare previsioni", "Gli errori del modello", "Il nome del modello"]'::jsonb, 1, 'Le feature sono le variabili di input (es. età, prezzo, pixel di un''immagine) che il modello analizza per produrre una previsione o una classificazione.'),
  ('LLM e Chatbot', 'easy', 'Cosa significa l''acronimo "LLM"?', '["Large Language Model", "Long List Memory", "Linear Learning Machine", "Local Language Method"]'::jsonb, 0, 'LLM sta per Large Language Model, cioè un modello linguistico di grandi dimensioni addestrato su enormi quantità di testo.'),
  ('LLM e Chatbot', 'easy', 'Su cosa si basano i moderni chatbot come ChatGPT?', '["Un database di risposte scritte a mano per ogni domanda", "Modelli linguistici addestrati a prevedere il testo più probabile", "Solo ricerche su Google in tempo reale", "Regole logiche if-then scritte manualmente"]'::jsonb, 1, 'I chatbot basati su LLM generano risposte prevedendo, parola dopo parola, il testo statisticamente più plausibile in base a ciò che hanno appreso durante l''addestramento.'),
  ('LLM e Chatbot', 'easy', 'Cosa si intende quando un chatbot "ha le allucinazioni"?', '["Il software si blocca", "Genera informazioni false o inventate presentandole come vere", "Mostra immagini psichedeliche", "Si riferisce a un bug grafico"]'::jsonb, 1, 'Le ''allucinazioni'' sono risposte che un LLM genera con sicurezza ma che sono in realtà false o inventate, perché il modello predice testo plausibile, non verificato.'),
  ('LLM e Chatbot', 'easy', 'Cos''è un "token" nel contesto degli LLM?', '["Una criptovaluta", "Un''unità di testo (parola o parte di parola) che il modello elabora", "Una password di accesso", "Un tipo di server"]'::jsonb, 1, 'I modelli linguistici scompongono il testo in token, piccole unità (parole intere o frammenti di parole), che vengono elaborate numericamente.'),
  ('LLM e Chatbot', 'easy', 'Cosa significa "GPT" nel nome di modelli come ChatGPT?', '["Generic Public Tool", "Generative Pre-trained Transformer", "Global Processing Technology", "General Purpose Test"]'::jsonb, 1, 'GPT sta per Generative Pre-trained Transformer: un modello generativo, pre-addestrato su grandi quantità di testo, basato sull''architettura Transformer.'),
  ('LLM e Chatbot', 'easy', 'I chatbot basati su LLM hanno davvero "capito" ciò che dicono, nel senso umano del termine?', '["Sì, sono coscienti come un umano", "No, elaborano pattern statistici del linguaggio senza comprensione o coscienza", "Solo alcuni modelli molto grandi sono coscienti", "Dipende dal browser usato"]'::jsonb, 1, 'Gli LLM non possiedono comprensione o coscienza: generano testo sulla base di pattern statistici appresi dai dati, per quanto le risposte possano sembrare consapevoli.'),
  ('LLM e Chatbot', 'easy', 'Cosa può migliorare la qualità della risposta di un chatbot AI?', '["Fare domande vaghe e generiche", "Fornire un contesto chiaro e dettagli specifici nella richiesta", "Scrivere tutto maiuscolo", "Non specificare mai cosa si vuole ottenere"]'::jsonb, 1, 'Più il contesto e i dettagli forniti nella richiesta sono chiari e specifici, più il modello ha elementi per generare una risposta pertinente e utile.'),
  ('LLM e Chatbot', 'easy', 'Cosa vuol dire che un LLM ha una "finestra di contesto" limitata?', '["Può vedere solo una quantità massima di testo alla volta", "Funziona solo in una finestra del browser", "Ha un limite di utenti contemporanei", "Si riferisce alla luminosità dello schermo"]'::jsonb, 0, 'La finestra di contesto è la quantità massima di testo (misurata in token) che il modello può ''tenere a mente'' contemporaneamente durante una conversazione.'),
  ('Prompt Engineering', 'easy', 'Cos''è il "prompt" quando si usa un''AI generativa?', '["Il nome del modello", "Il testo di istruzione o domanda che si invia all''AI", "Un tipo di errore del sistema", "L''output finale generato"]'::jsonb, 1, 'Il prompt è il testo (domanda, istruzione, contesto) che l''utente fornisce all''AI per ottenere una risposta o un contenuto generato.'),
  ('Prompt Engineering', 'easy', 'Cos''è il "Prompt Engineering"?', '["Costruire fisicamente i server per l''AI", "La pratica di formulare istruzioni efficaci per ottenere risposte migliori da un''AI", "Un linguaggio di programmazione per hardware", "La manutenzione dei cavi di rete"]'::jsonb, 1, 'Il Prompt Engineering è la pratica di progettare e affinare le istruzioni date a un modello di AI per ottenere risultati più precisi e utili.'),
  ('Prompt Engineering', 'easy', 'Quale di queste è una buona pratica per scrivere un prompt efficace?', '["Essere il più vago possibile", "Specificare chiaramente obiettivo, contesto e formato desiderato della risposta", "Scrivere una sola parola sempre", "Evitare di dare esempi"]'::jsonb, 1, 'Un buon prompt indica chiaramente cosa si vuole ottenere, il contesto utile e, se serve, il formato della risposta: questo riduce ambiguità e migliora il risultato.'),
  ('Prompt Engineering', 'easy', 'Cosa si intende per "few-shot prompting"?', '["Inviare pochissimi messaggi al giorno", "Fornire alcuni esempi di input/output nel prompt per guidare il modello", "Usare un modello con pochi parametri", "Ridurre la lunghezza massima della risposta"]'::jsonb, 1, 'Nel few-shot prompting si includono nel prompt alcuni esempi (input → output desiderato) per mostrare al modello lo schema da seguire.'),
  ('Prompt Engineering', 'easy', 'Perché può essere utile assegnare un "ruolo" all''AI in un prompt (es. "Agisci come un insegnante di matematica")?', '["Non serve a nulla", "Aiuta a orientare tono, stile e livello di dettaglio della risposta", "Cambia il modello usato dal server", "Rallenta sempre la risposta"]'::jsonb, 1, 'Definire un ruolo o una persona aiuta il modello a calibrare tono, linguaggio e prospettiva della risposta in base al contesto richiesto.'),
  ('Prompt Engineering', 'easy', 'Cosa si intende per "prompt injection"?', '["Un aggiornamento software del modello", "Un tentativo di manipolare l''AI con istruzioni nascoste nel testo per farle ignorare le regole originali", "Un tipo di allenamento del modello", "Un errore di connessione internet"]'::jsonb, 1, 'Il prompt injection è una tecnica in cui si inseriscono istruzioni nascoste o ingannevoli in un testo per far deviare l''AI dal suo comportamento previsto.'),
  ('Prompt Engineering', 'easy', 'Se la risposta di un''AI non è quella desiderata, cosa conviene fare?', '["Rinunciare subito", "Riformulare o affinare il prompt con più dettagli o esempi", "Cambiare sempre computer", "Aspettare che il problema si risolva da solo"]'::jsonb, 1, 'Il prompting è spesso iterativo: riformulare la richiesta, aggiungere contesto o esempi aiuta a ottenere risposte più vicine a ciò che si desidera.'),
  ('Storia dell''AI', 'easy', 'Chi propose nel 1950 un celebre test per valutare se una macchina potesse mostrare comportamento intelligente indistinguibile da un umano?', '["Alan Turing", "Bill Gates", "Steve Jobs", "Isaac Asimov"]'::jsonb, 0, 'Alan Turing propose nel 1950 il cosiddetto ''Test di Turing'', in cui una macchina supera la prova se un valutatore umano non riesce a distinguere le sue risposte da quelle di una persona.'),
  ('Storia dell''AI', 'easy', 'In quale decennio fu coniato ufficialmente il termine "Intelligenza Artificiale" durante una famosa conferenza?', '["Anni ''50 (conferenza di Dartmouth, 1956)", "Anni ''80", "Anni ''90", "Anni 2010"]'::jsonb, 0, 'Il termine ''Artificial Intelligence'' fu coniato nel 1956 alla Dartmouth Conference, considerata l''atto di nascita ufficiale della disciplina.'),
  ('Storia dell''AI', 'easy', 'Come si chiamava il programma di IBM che nel 1997 sconfisse il campione del mondo di scacchi Garry Kasparov?', '["Deep Blue", "Watson", "AlphaGo", "Blue Gene"]'::jsonb, 0, 'Deep Blue, sviluppato da IBM, sconfisse il campione del mondo Garry Kasparov in un match del 1997, un momento simbolico per l''AI.'),
  ('Storia dell''AI', 'easy', 'Cosa furono i cosiddetti "inverni dell''AI" (AI winters)?', '["Periodi di forte crescita degli investimenti", "Periodi di scarso interesse e finanziamenti dopo aspettative deluse", "Le stagioni in cui si allenano i modelli", "Un tipo di algoritmo di raffreddamento hardware"]'::jsonb, 1, 'Gli ''inverni dell''AI'' furono periodi (specialmente anni ''70 e fine anni ''80) in cui entusiasmo e finanziamenti calarono dopo che i risultati non avevano mantenuto le promesse iniziali.'),
  ('Storia dell''AI', 'easy', 'Quale sistema di IBM divenne famoso nel 2011 vincendo il quiz televisivo americano Jeopardy! contro campioni umani?', '["Watson", "Siri", "Deep Blue", "Cortana"]'::jsonb, 0, 'Watson, sviluppato da IBM, vinse nel 2011 il quiz Jeopardy! battendo due dei migliori concorrenti umani di sempre.'),
  ('Storia dell''AI', 'easy', 'Quale evento del 2012 è considerato un punto di svolta per il Deep Learning, grazie a una rete neurale che vinse una celebre competizione di riconoscimento immagini?', '["Il successo di AlexNet nella competizione ImageNet", "Il lancio del primo iPhone", "L''invenzione del linguaggio Python", "La fondazione di Google"]'::jsonb, 0, 'Nel 2012 la rete neurale AlexNet vinse nettamente la competizione ImageNet, dimostrando la potenza del Deep Learning e dando avvio alla sua diffusione su larga scala.'),
  ('Storia dell''AI', 'easy', 'In che anno è stato lanciato pubblicamente ChatGPT, portando gli LLM all''attenzione del grande pubblico?', '["2015", "2018", "2022", "2025"]'::jsonb, 2, 'ChatGPT è stato lanciato da OpenAI a novembre 2022, diventando in pochi mesi uno dei prodotti software con la crescita di utenti più rapida della storia.'),
  ('Etica e società', 'easy', 'Cosa si intende per "bias" (distorsione) in un sistema di AI?', '["Un errore di connessione internet", "Una tendenza sistematica a risultati ingiusti o distorti, spesso ereditata dai dati di addestramento", "Un tipo di virus informatico", "La velocità di calcolo del modello"]'::jsonb, 1, 'Il bias in AI è una distorsione sistematica nei risultati, spesso causata da dati di addestramento non rappresentativi o già affetti da pregiudizi storici.'),
  ('Etica e società', 'easy', 'Perché la trasparenza è considerata importante nei sistemi di AI usati per decisioni che riguardano le persone (es. selezione del personale, credito)?', '["Non è importante", "Perché aiuta a capire e verificare come vengono prese le decisioni, riducendo il rischio di discriminazioni ingiuste", "Perché rende il sistema più lento", "Perché è richiesta solo per motivi estetici"]'::jsonb, 1, 'La trasparenza permette di comprendere e controllare il processo decisionale di un sistema AI, individuando eventuali discriminazioni o errori prima che causino danni.'),
  ('Etica e società', 'easy', 'Cosa si intende per "deepfake"?', '["Un tipo di rete neurale per il gioco degli scacchi", "Contenuti video/audio falsificati e resi realistici tramite AI", "Un errore comune nei modelli di traduzione", "Un termine per indicare dati mancanti"]'::jsonb, 1, 'I deepfake sono contenuti multimediali (spesso video o audio) manipolati con tecniche di AI per far sembrare reale qualcosa che non lo è, ad esempio sostituendo un volto.'),
  ('Etica e società', 'easy', 'Quale rischio riguarda la privacy nell''uso di sistemi di AI addestrati su grandi quantità di dati personali?', '["Nessun rischio, i dati vengono sempre cancellati subito", "I dati personali potrebbero essere usati, memorizzati o dedotti senza un consenso adeguato", "L''AI non usa mai dati personali", "Riguarda solo i dati finanziari"]'::jsonb, 1, 'I sistemi di AI possono raccogliere, elaborare o persino dedurre informazioni personali sensibili, sollevando questioni di consenso, sicurezza e uso corretto dei dati.'),
  ('Etica e società', 'easy', 'Cosa significa "AI responsabile" o "AI etica"?', '["Un''AI che risponde sempre ''sì'' agli utenti", "Un approccio allo sviluppo dell''AI attento a equità, trasparenza, sicurezza e impatto sociale", "Un''AI che costa di più", "Un''AI usata solo da governi"]'::jsonb, 1, 'L''AI responsabile/etica indica pratiche e principi di sviluppo che tengono conto di equità, trasparenza, sicurezza, privacy e impatto sulla società, non solo delle prestazioni tecniche.'),
  ('Etica e società', 'easy', 'Quale preoccupazione viene spesso citata riguardo all''impatto dell''AI sul mondo del lavoro?', '["L''AI non ha alcun impatto sul lavoro", "L''automazione di alcune mansioni potrebbe trasformare o eliminare certi tipi di lavoro", "L''AI crea solo nuovi posti di lavoro, senza mai eliminarne", "Riguarda solo il settore agricolo"]'::jsonb, 1, 'L''AI può automatizzare compiti ripetitivi o prevedibili, trasformando alcune professioni ed eliminandone altre, mentre ne crea di nuove in ambiti diversi: un tema centrale del dibattito pubblico.'),
  ('Etica e società', 'easy', 'Perché è consigliabile verificare le informazioni fornite da un chatbot AI prima di usarle per decisioni importanti?', '["Non serve mai verificarle", "Un modello può generare informazioni errate o inventate con apparente sicurezza (allucinazioni)", "I chatbot sono certificati da un ente pubblico", "Le risposte sono sempre aggiornate in tempo reale"]'::jsonb, 1, 'Poiché gli LLM possono generare ''allucinazioni'' (informazioni plausibili ma false), è buona norma verificare dati importanti con fonti affidabili prima di prendere decisioni basate su di essi.');

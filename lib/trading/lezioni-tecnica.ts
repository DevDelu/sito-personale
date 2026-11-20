// Moduli di analisi tecnica della Scuola: candele, trend, livelli,
// indicatori, pattern, rischio. Testo in blocchi tipizzati (vedi tipi.ts).

import type { Lezione } from "./tipi";

export const LEZIONI_TECNICA: Lezione[] = [
  // ───────────── FONDAMENTA ─────────────
  {
    slug: "candele",
    modulo: "tecnica-base",
    titolo: "Leggere una candela",
    sottotitolo: "Apertura, massimo, minimo, chiusura",
    minuti: 5,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Ogni candela riassume un periodo di tempo (un giorno, un'ora, 5 minuti: è il **timeframe**). Ti dice quattro prezzi: dove il periodo è **aperto**, il **massimo** toccato, il **minimo** e dove ha **chiuso**. Sono i dati OHLC (Open, High, Low, Close).",
      },
      { tipo: "anatomia" },
      {
        tipo: "punti",
        titolo: "Cosa ti racconta la forma",
        voci: [
          "**Corpo lungo**: un lato ha dominato il periodo (compratori se verde, venditori se rossa).",
          "**Corpo piccolo**: equilibrio, indecisione.",
          "**Ombra lunga in basso**: il prezzo è sceso ma è stato ricomprato, cioè c'è domanda sotto.",
          "**Ombra lunga in alto**: il prezzo è salito ma è stato venduto, cioè c'è offerta sopra.",
        ],
      },
      {
        tipo: "grafico",
        scenario: "rialzo",
        strumenti: ["volumi"],
        didascalia: "Tocca le candele per leggerne apertura (A), massimo (M), minimo (m) e chiusura (C).",
      },
      {
        tipo: "nvda",
        testo:
          "Apri NVDA su TradingView con timeframe giornaliero (1D). Guarda le ultime 5 candele: quante hanno ombre lunghe? Dove si trovano? Le ombre lunghe in basso vicino a un minimo precedente sono spesso il primo indizio di un supporto.",
      },
    ],
    quiz: [
      {
        domanda: "Una candela rossa con apertura 120 e chiusura 115: cosa è successo?",
        opzioni: ["Il prezzo è salito da 115 a 120", "Il prezzo ha chiuso sotto l'apertura", "Il massimo è 115"],
        corretta: 1,
        spiegazione: "Rossa significa chiusura sotto l'apertura: da 120 a 115. Il massimo è almeno 120.",
      },
      {
        domanda: "Un'ombra inferiore molto lunga indica che…",
        opzioni: ["i venditori hanno vinto il periodo", "il prezzo è sceso ma è stato ricomprato", "i volumi sono bassi"],
        corretta: 1,
        spiegazione: "Il minimo è lontano dalla chiusura: chi vendeva è stato assorbito da chi comprava.",
      },
    ],
  },
  {
    slug: "trend",
    modulo: "tecnica-base",
    titolo: "Il trend",
    sottotitolo: "Massimi e minimi crescenti o decrescenti",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Il prezzo non sale né scende in linea retta: si muove a onde. Un **trend rialzista** è una sequenza di **massimi e minimi crescenti**: ogni ritracciamento si ferma più in alto del precedente. Un **trend ribassista** è l'opposto: massimi e minimi decrescenti.",
      },
      {
        tipo: "grafico",
        scenario: "rialzo",
        strumenti: ["annotazioni", "trendline"],
        attivi: ["annotazioni"],
        didascalia: "Ogni minimo è più alto del precedente: finché la sequenza regge, il trend è rialzista.",
      },
      {
        tipo: "grafico",
        scenario: "ribasso",
        strumenti: ["trendline"],
        didascalia: "Trend ribassista: ogni rimbalzo si ferma sotto il massimo precedente.",
      },
      {
        tipo: "punti",
        titolo: "Regole pratiche",
        voci: [
          "**Il trend è tuo amico**: comprare in un trend ribassista significa nuotare controcorrente.",
          "Un trend rialzista **si incrina** quando il prezzo rompe l'ultimo minimo crescente.",
          "**Timeframe diversi, trend diversi**: NVDA può essere rialzista sul settimanale e in correzione sul giornaliero. Parti sempre dal timeframe più ampio.",
        ],
      },
      {
        tipo: "nvda",
        testo:
          "Analisi multi-timeframe su NVDA: guarda prima il grafico settimanale (1W) per capire il trend principale, poi il giornaliero (1D) per vedere dove sei dentro quel trend. Chiediti: l'ultimo minimo è più alto del precedente?",
      },
    ],
    quiz: [
      {
        domanda: "Cosa definisce un trend rialzista?",
        opzioni: ["Più candele verdi che rosse", "Massimi e minimi crescenti", "Il prezzo sopra 100"],
        corretta: 1,
        spiegazione: "Conta la struttura: ogni minimo più alto del precedente, ogni massimo più alto del precedente.",
      },
      {
        domanda: "Il settimanale è rialzista, il giornaliero scende da 2 settimane. Come lo leggi?",
        opzioni: ["Il trend principale è finito", "Una correzione dentro un trend rialzista, da monitorare", "Bisogna vendere subito"],
        corretta: 1,
        spiegazione: "Il timeframe più ampio comanda. La discesa giornaliera è una correzione finché non rompe i minimi del settimanale.",
      },
    ],
  },
  {
    slug: "supporti-resistenze",
    modulo: "tecnica-base",
    titolo: "Supporti e resistenze",
    sottotitolo: "Dove il prezzo si ferma, e perché",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Un **supporto** è una zona di prezzo dove gli acquisti hanno fermato le discese più volte. Una **resistenza** è una zona dove le vendite hanno fermato le salite. Funzionano perché il mercato ha memoria: chi ha comprato a 100 e ha visto salire tende a ricomprare a 100; chi è rimasto intrappolato a 120 vende appena torna in pari.",
      },
      {
        tipo: "grafico",
        scenario: "laterale",
        strumenti: ["livelli", "annotazioni", "volumi"],
        attivi: ["livelli"],
        didascalia: "Il prezzo rimbalza tra 100 e 120, poi rompe 120 con volumi alti. Attiva Note e Volumi.",
      },
      {
        tipo: "punti",
        titolo: "Da sapere",
        voci: [
          "Sono **zone**, non prezzi esatti: ragiona con un margine dell'1-2%.",
          "**Più tocchi** = livello più importante, ma anche più ordini consumati: dopo molti test spesso cede.",
          "**Inversione di polarità**: una resistenza rotta diventa supporto. Il ritorno sul livello rotto si chiama **retest**.",
          "**Numeri tondi** (100, 150, 200 dollari) e **massimi storici** sono livelli psicologici.",
        ],
      },
      {
        tipo: "grafico",
        scenario: "laterale",
        strumenti: ["livelli"],
        disegno: true,
        didascalia: "Esercizio: scegli Livello e tocca il prezzo dove vedi i rimbalzi. Poi attiva Livelli per confrontare.",
      },
      {
        tipo: "nvda",
        testo:
          "Su NVDA segna con linee orizzontali i 2-3 minimi più evidenti degli ultimi 6 mesi e i massimi da cui il prezzo è sceso. Sono i livelli che il Radar Mercati cita come S1/S2 e R1/R2 nell'email.",
      },
    ],
    quiz: [
      {
        domanda: "Una resistenza a 120 viene rotta con volumi alti. Il prezzo torna a 121. Cosa ti aspetti tipicamente?",
        opzioni: ["Che 120 faccia da supporto (retest)", "Che crolli sotto 100", "Niente: i livelli rotti non contano più"],
        corretta: 0,
        spiegazione: "Inversione di polarità: chi ha venduto a 120 e chi non è entrato sulla rottura comprano al ritorno.",
      },
      {
        domanda: "Perché si parla di zone e non di prezzi esatti?",
        opzioni: ["Perché i grafici sono imprecisi", "Perché gli ordini si concentrano in un intorno del livello", "Per comodità"],
        corretta: 1,
        spiegazione: "Migliaia di operatori mettono ordini vicino al livello, non tutti allo stesso centesimo.",
      },
    ],
  },
  {
    slug: "trendline",
    modulo: "tecnica-base",
    titolo: "Tracciare trendline e canali",
    sottotitolo: "Collegare minimi e massimi nel modo giusto",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Una **trendline rialzista** collega almeno due minimi crescenti e si prolunga a destra: finché il prezzo resta sopra, il trend è intatto. Una **trendline ribassista** collega massimi decrescenti. Tracciando una parallela sul lato opposto ottieni un **canale**.",
      },
      {
        tipo: "punti",
        titolo: "Come si traccia bene",
        voci: [
          "Collega **minimi con minimi** (trend rialzista) o **massimi con massimi** (ribassista), mai a caso.",
          "Due punti tracciano una linea, il **terzo tocco la conferma**.",
          "Usa le **ombre o i corpi**, ma sempre lo stesso criterio.",
          "Non forzarla: se devi tagliare molte candele per farla passare, non è la linea giusta.",
          "Più è **ripida**, prima si rompe. Le trendline a 30-45° sono le più affidabili.",
        ],
      },
      {
        tipo: "grafico",
        scenario: "rialzo",
        strumenti: ["trendline", "annotazioni"],
        disegno: true,
        didascalia: "Esercizio: scegli Trendline, tocca il primo minimo e poi il secondo. Attiva Trendline per vedere la soluzione.",
      },
      {
        tipo: "grafico",
        scenario: "ribasso",
        strumenti: ["trendline"],
        disegno: true,
        didascalia: "Ora in un ribasso: collega i massimi decrescenti.",
      },
      {
        tipo: "attenzione",
        testo:
          "La rottura di una trendline **non** è un segnale di inversione da sola: spesso il prezzo passa da trend a laterale. Aspetta la conferma (rottura dell'ultimo minimo, chiusura sotto con volumi).",
      },
    ],
    quiz: [
      {
        domanda: "Quanti tocchi servono per considerare valida una trendline?",
        opzioni: ["1", "2 per tracciarla, il 3° la conferma", "Almeno 10"],
        corretta: 1,
        spiegazione: "Due punti definiscono una linea qualsiasi; è il terzo rispetto che dice che il mercato la sta usando.",
      },
      {
        domanda: "In un trend rialzista colleghi…",
        opzioni: ["i massimi", "i minimi", "le chiusure a caso"],
        corretta: 1,
        spiegazione: "La trendline rialzista è il supporto dinamico: passa sotto il prezzo, sui minimi crescenti.",
      },
    ],
  },
  {
    slug: "volumi",
    modulo: "tecnica-base",
    titolo: "I volumi",
    sottotitolo: "La forza dietro il movimento",
    minuti: 5,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Il **volume** è quante azioni sono passate di mano nel periodo. Il prezzo dice **dove** va il mercato, il volume dice **con quanta convinzione**. Una rottura con volumi alti è sostenuta da tanti operatori; con volumi bassi è sospetta.",
      },
      {
        tipo: "grafico",
        scenario: "laterale",
        strumenti: ["volumi", "livelli", "annotazioni"],
        attivi: ["volumi", "livelli"],
        didascalia: "Nota il picco di volumi proprio sulla rottura di 120.",
      },
      {
        tipo: "punti",
        titolo: "Letture utili",
        voci: [
          "**Trend sano**: volumi più alti nelle candele a favore del trend, più bassi nei ritracciamenti.",
          "**Rottura + volumi** sopra la media = conferma. Rottura senza volumi = rischio di falsa rottura.",
          "**Volumi enormi dopo un lungo calo** possono segnare una capitolazione (chi doveva vendere ha venduto).",
          "Confronta il volume con la sua **media a 20 o 50 giorni**, non in assoluto.",
        ],
      },
      {
        tipo: "nvda",
        testo:
          "NVDA ha volumi giornalieri enormi e spesso sopra la media nei giorni della trimestrale. Nel briefing trovi \"volumi vs media\": se NVDA rompe un livello con volumi sotto la media, vale meno.",
      },
    ],
    quiz: [
      {
        domanda: "Il prezzo rompe una resistenza con volumi a metà della media. Come la valuti?",
        opzioni: ["Rottura forte", "Rottura poco convincente, possibile falsa rottura", "Indifferente"],
        corretta: 1,
        spiegazione: "Senza partecipazione la rottura può rientrare: aspetta conferme.",
      },
    ],
  },

  // ───────────── INDICATORI ─────────────
  {
    slug: "medie-mobili",
    modulo: "tecnica-indicatori",
    titolo: "Le medie mobili",
    sottotitolo: "SMA ed EMA, 20/50/200",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Una **media mobile semplice (SMA)** a 20 giorni è la media delle ultime 20 chiusure, ricalcolata ogni giorno: leviga il rumore e mostra la direzione. La **media esponenziale (EMA)** dà più peso ai prezzi recenti, quindi reagisce prima (ma dà più falsi segnali).",
      },
      {
        tipo: "grafico",
        scenario: "incrocio",
        strumenti: ["sma20", "ema20", "sma50", "sma200"],
        attivi: ["sma20", "sma50"],
        didascalia: "Accendi e spegni le medie: la 20 segue da vicino, la 200 mostra il quadro di fondo.",
      },
      {
        tipo: "punti",
        titolo: "Le tre medie che tutti guardano",
        voci: [
          "**20 giorni**: trend di breve (circa un mese di Borsa).",
          "**50 giorni**: trend di medio periodo, spesso fa da supporto nei trend sani.",
          "**200 giorni**: trend di lungo periodo. Sopra = mercato toro per molti gestori; sotto = cautela.",
          "**Pendenza** conta quanto la posizione: una media piatta indica assenza di trend.",
          "Le medie fanno da **supporti/resistenze dinamici**: in un trend forte i ritracciamenti si fermano spesso sulla 20 o sulla 50.",
        ],
      },
      {
        tipo: "nvda",
        testo:
          "Aggiungi su TradingView a NVDA la SMA 50 e la SMA 200 (indicatore \"Moving Average\"). Prezzo sopra entrambe con medie inclinate verso l'alto = trend rialzista solido. Prezzo sotto la 50 ma sopra la 200 = correzione dentro un trend di lungo ancora positivo.",
      },
    ],
    quiz: [
      {
        domanda: "Qual è la differenza tra SMA ed EMA?",
        opzioni: ["L'EMA pesa di più i prezzi recenti", "La SMA usa i massimi", "Nessuna"],
        corretta: 0,
        spiegazione: "L'EMA è più reattiva perché i prezzi recenti contano di più: segnali prima, ma più falsi.",
      },
      {
        domanda: "Il prezzo è sotto la SMA 200 e la media scende. Che quadro è?",
        opzioni: ["Trend di lungo rialzista", "Trend di lungo ribassista", "Laterale"],
        corretta: 1,
        spiegazione: "Sotto una 200 inclinata verso il basso il trend di fondo è negativo.",
      },
    ],
  },
  {
    slug: "incroci",
    modulo: "tecnica-indicatori",
    titolo: "Golden cross e death cross",
    sottotitolo: "Quando le medie si incrociano",
    minuti: 5,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Il **golden cross** è quando la media a 50 giorni passa **sopra** la media a 200: segnala che il trend di medio periodo è tornato più forte di quello di lungo. Il **death cross** è l'opposto. Sono segnali **lenti**: confermano un cambio già avvenuto, non lo anticipano.",
      },
      {
        tipo: "grafico",
        scenario: "incrocio",
        strumenti: ["sma50", "sma200", "sma20"],
        attivi: ["sma50", "sma200"],
        didascalia: "Trova il punto in cui la SMA 50 (gialla) supera la SMA 200 (viola): è il golden cross.",
      },
      {
        tipo: "punti",
        voci: [
          "Più utile come **filtro** che come segnale d'ingresso: operare long solo dopo un golden cross evita molti ribassi lunghi.",
          "In un mercato laterale le medie si incrociano spesso e i segnali falliscono (whipsaw).",
          "Versione veloce: incrocio tra EMA 20 e SMA 50, più reattivo ma meno affidabile.",
        ],
      },
    ],
    quiz: [
      {
        domanda: "Il golden cross è…",
        opzioni: ["SMA 50 sopra SMA 200", "Prezzo sopra 200 dollari", "RSI sopra 70"],
        corretta: 0,
        spiegazione: "La media di medio periodo incrocia al rialzo quella di lungo periodo.",
      },
      {
        domanda: "Perché il golden cross arriva spesso in ritardo?",
        opzioni: ["Perché le medie lunghe reagiscono lentamente", "Perché i dati arrivano tardi", "Non è vero"],
        corretta: 0,
        spiegazione: "La 200 incorpora 10 mesi di prezzi: quando si gira il rialzo è già partito da tempo.",
      },
    ],
  },
  {
    slug: "rsi",
    modulo: "tecnica-indicatori",
    titolo: "RSI",
    sottotitolo: "Ipercomprato, ipervenduto, divergenze",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "L'**RSI (Relative Strength Index)** misura da 0 a 100 la forza dei rialzi rispetto ai ribassi delle ultime 14 candele. Sopra **70** si parla di **ipercomprato** (salita molto veloce), sotto **30** di **ipervenduto**.",
      },
      {
        tipo: "grafico",
        scenario: "divergenza",
        strumenti: ["rsi", "annotazioni"],
        attivi: ["rsi", "annotazioni"],
        didascalia: "Il secondo minimo del prezzo è più basso, ma l'RSI fa un minimo più alto: divergenza rialzista.",
      },
      {
        tipo: "punti",
        titolo: "Come usarlo (e come no)",
        voci: [
          "**Ipercomprato non vuol dire \"vendi\"**: in un trend forte l'RSI resta sopra 70 per settimane.",
          "Più utile: nei trend rialzisti l'RSI che scende verso **40-50 e rimbalza** indica ritracciamenti comprati.",
          "**Divergenza rialzista**: prezzo fa un minimo più basso, RSI un minimo più alto. La spinta ribassista si sta esaurendo.",
          "**Divergenza ribassista**: prezzo fa un massimo più alto, RSI un massimo più basso.",
          "Le divergenze avvisano, non danno il tempo: aspetta una conferma sul prezzo.",
        ],
      },
      {
        tipo: "nvda",
        testo:
          "Un RSI sotto 30 su NVDA segnala paura e vendite molto rapide: a volte precede un rimbalzo, ma non lo garantisce né ti dice quando. Nel briefing, \"RSI\" ti dice se il titolo è in una zona estrema: usalo per non inseguire un rialzo già tirato (RSI > 75) o per notare un'eccessiva paura.",
      },
    ],
    quiz: [
      {
        domanda: "RSI a 78 in pieno trend rialzista. Cosa significa?",
        opzioni: ["Vendita obbligatoria", "Il rialzo è forte e tirato: attenzione a entrare ora, non per forza inversione", "Il titolo è sottovalutato"],
        corretta: 1,
        spiegazione: "Ipercomprato descrive velocità, non direzione futura. Può restare così a lungo.",
      },
      {
        domanda: "Prezzo: minimo più basso. RSI: minimo più alto. È…",
        opzioni: ["Divergenza rialzista", "Divergenza ribassista", "Golden cross"],
        corretta: 0,
        spiegazione: "Il prezzo scende ma con meno forza: possibile esaurimento del ribasso.",
      },
    ],
  },
  {
    slug: "macd",
    modulo: "tecnica-indicatori",
    titolo: "MACD",
    sottotitolo: "Momentum e incroci di segnale",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Il **MACD** è la differenza tra la EMA a 12 e la EMA a 26. La **linea di segnale** è la EMA a 9 del MACD, l'**istogramma** è la distanza tra le due. Misura il **momentum**: quanto velocemente il trend accelera o rallenta.",
      },
      {
        tipo: "grafico",
        scenario: "fibonacci",
        strumenti: ["macd", "ema20"],
        attivi: ["macd"],
        didascalia: "Istogramma verde che cresce = momentum rialzista in aumento; che si restringe = momentum che rallenta.",
      },
      {
        tipo: "punti",
        voci: [
          "**MACD incrocia sopra la linea di segnale**: momentum che gira al rialzo (e viceversa).",
          "**MACD sopra lo zero**: EMA 12 sopra EMA 26, cioè trend di breve rialzista.",
          "**Istogramma che si restringe** prima dell'incrocio: primo avviso di rallentamento.",
          "Come l'RSI, funziona meglio con il trend: gli incroci rialzisti sopra lo zero sono più affidabili.",
        ],
      },
    ],
    quiz: [
      {
        domanda: "L'istogramma MACD si restringe mentre il prezzo sale ancora. Cosa indica?",
        opzioni: ["Momentum in accelerazione", "Momentum in rallentamento", "Volumi in calo"],
        corretta: 1,
        spiegazione: "Il prezzo sale ma la spinta diminuisce: possibile pausa o ritracciamento.",
      },
    ],
  },
  {
    slug: "bollinger",
    modulo: "tecnica-indicatori",
    titolo: "Bande di Bollinger",
    sottotitolo: "Volatilità e squeeze",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Le **bande di Bollinger** sono una SMA a 20 con due bande a ±2 deviazioni standard. Si allargano quando la volatilità sale, si stringono quando il mercato si comprime. Circa il 90% delle chiusure cade dentro le bande.",
      },
      {
        tipo: "grafico",
        scenario: "squeeze",
        strumenti: ["bollinger", "volumi"],
        attivi: ["bollinger"],
        didascalia: "Le bande si stringono (squeeze) e poi esplodono con la rottura e i volumi.",
      },
      {
        tipo: "punti",
        voci: [
          "**Squeeze**: bande strettissime = volatilità ai minimi. Di solito precede un movimento forte, ma non dice in che direzione.",
          "**Camminare sulla banda**: in un trend forte il prezzo resta attaccato alla banda superiore. Toccarla non è un segnale di vendita.",
          "In un laterale, i tocchi delle bande funzionano come estremi del range.",
        ],
      },
      {
        tipo: "nvda",
        testo:
          "Prima delle trimestrali di NVDA le bande spesso si stringono: il mercato aspetta. Lo squeeze ti dice \"sta per muoversi\", la trimestrale ti dice quando.",
      },
    ],
    quiz: [
      {
        domanda: "Uno squeeze di Bollinger indica…",
        opzioni: ["Che il prezzo salirà", "Che la volatilità è compressa e un movimento forte è probabile", "Ipercomprato"],
        corretta: 1,
        spiegazione: "Lo squeeze dice quanto, non da che parte: la direzione la dà la rottura.",
      },
    ],
  },
  {
    slug: "fibonacci",
    modulo: "tecnica-indicatori",
    titolo: "Ritracciamenti di Fibonacci",
    sottotitolo: "Dove può fermarsi una correzione",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Dopo un forte rialzo il prezzo ritraccia una parte del movimento. I **ritracciamenti di Fibonacci** (38,2%, 50%, 61,8%) sono le zone dove molti operatori si aspettano che la correzione si fermi. Si tracciano dal **minimo** al **massimo** del movimento (in un trend rialzista).",
      },
      {
        tipo: "grafico",
        scenario: "fibonacci",
        strumenti: ["fibonacci", "sma50", "volumi"],
        attivi: ["fibonacci"],
        didascalia: "Impulso da 100 a 150, correzione che si ferma vicino al 61,8% (≈119), poi ripartenza.",
      },
      {
        tipo: "punti",
        voci: [
          "**38,2%**: correzione leggera, tipica di trend molto forti.",
          "**50%**: non è un numero di Fibonacci, ma è molto seguito.",
          "**61,8%**: l'ultima difesa del trend. Se cede, il rialzo spesso è finito.",
          "Funzionano meglio quando **coincidono** con un altro livello (supporto, media 50, trendline): si parla di **confluenza**.",
        ],
      },
      {
        tipo: "nvda",
        testo:
          "Su TradingView usa lo strumento \"Fib Retracement\": clicca sul minimo del rialzo di NVDA e poi sul massimo. Guarda se l'ultima correzione si è fermata vicino a 38,2%, 50% o 61,8%.",
      },
    ],
    quiz: [
      {
        domanda: "Un movimento da 100 a 150: dove cade il ritracciamento del 61,8%?",
        opzioni: ["130,9", "119,1", "161,8"],
        corretta: 1,
        spiegazione: "150 − (50 × 0,618) = 119,1.",
      },
      {
        domanda: "Quando un livello di Fibonacci è più affidabile?",
        opzioni: ["Quando coincide con altri livelli (confluenza)", "Sempre allo stesso modo", "Solo sul 23,6%"],
        corretta: 0,
        spiegazione: "Più ragioni indipendenti per lo stesso prezzo = più ordini concentrati lì.",
      },
    ],
  },

  // ───────────── PATTERN E OPERATIVITÀ ─────────────
  {
    slug: "pattern-grafici",
    modulo: "tecnica-operativa",
    titolo: "Pattern grafici",
    sottotitolo: "Doppio minimo, testa e spalle, triangoli",
    minuti: 9,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "I pattern sono forme ricorrenti che riflettono il cambio di equilibrio tra compratori e venditori. Ognuno ha una **neckline** (o un livello chiave): il pattern è **valido solo quando il prezzo la rompe**, non mentre si sta formando.",
      },
      {
        tipo: "grafico",
        scenario: "doppio-minimo",
        strumenti: ["livelli", "volumi"],
        attivi: ["livelli"],
        didascalia: "Doppio minimo: due rimbalzi da 100, rottura della neckline a 115. Target teorico: 115 + 15 = 130.",
      },
      {
        tipo: "grafico",
        scenario: "testa-spalle",
        strumenti: ["livelli", "annotazioni", "volumi"],
        attivi: ["livelli", "annotazioni"],
        didascalia: "Testa e spalle: tre massimi, quello centrale più alto. La rottura della neckline a 110 conferma l'inversione ribassista.",
      },
      {
        tipo: "grafico",
        scenario: "triangolo",
        strumenti: ["livelli", "trendline", "volumi"],
        attivi: ["livelli", "trendline"],
        didascalia: "Triangolo ascendente: resistenza piatta, minimi crescenti. I compratori premono finché la resistenza cede.",
      },
      {
        tipo: "punti",
        titolo: "Il target teorico",
        voci: [
          "Si misura l'**altezza** del pattern (dal fondo alla neckline) e la si proietta dal punto di rottura.",
          "È un riferimento, non una promessa: usalo per valutare se il rapporto rischio/rendimento ha senso.",
        ],
      },
    ],
    quiz: [
      {
        domanda: "Quando un doppio minimo è confermato?",
        opzioni: ["Al secondo rimbalzo da 100", "Alla rottura della neckline", "Quando l'RSI supera 50"],
        corretta: 1,
        spiegazione: "Prima della rottura è solo un laterale con due minimi: potrebbe diventare un triplo minimo o cedere.",
      },
      {
        domanda: "Testa e spalle è un pattern di…",
        opzioni: ["inversione ribassista", "continuazione rialzista", "volatilità"],
        corretta: 0,
        spiegazione: "Compare dopo un rialzo: la spalla destra più bassa della testa mostra compratori in calo.",
      },
    ],
  },
  {
    slug: "pattern-candele",
    modulo: "tecnica-operativa",
    titolo: "Pattern di candele",
    sottotitolo: "Martello, engulfing, doji",
    minuti: 5,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Alcune combinazioni di 1-2 candele segnalano un possibile cambio di forze. Contano **solo nel posto giusto**: un martello su un supporto importante dopo un calo vale molto; lo stesso martello a metà di un laterale non vale nulla.",
      },
      { tipo: "pattern-candele" },
      {
        tipo: "attenzione",
        testo:
          "Aspetta la **chiusura** della candela: un martello a metà giornata può diventare una candela rossa piena alla chiusura. E cerca conferma nella candela successiva.",
      },
    ],
    quiz: [
      {
        domanda: "Un martello vale di più se compare…",
        opzioni: ["dopo un ribasso, su un supporto", "in cima a un rialzo", "ovunque allo stesso modo"],
        corretta: 0,
        spiegazione: "Il contesto è tutto: segnala che i compratori difendono un livello noto.",
      },
    ],
  },
  {
    slug: "gestione-rischio",
    modulo: "tecnica-operativa",
    titolo: "Gestione del rischio",
    sottotitolo: "Stop loss, rischio/rendimento, quante azioni",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Questa è la lezione più importante. Nessun segnale funziona sempre: anche i trader migliori sbagliano il 40-50% delle operazioni. Restano in gioco perché **perdono poco quando sbagliano e guadagnano di più quando hanno ragione**.",
      },
      {
        tipo: "punti",
        titolo: "Le tre regole",
        voci: [
          "**Stop loss prima di entrare**: si mette dove il setup è smentito (sotto il supporto, sotto l'ultimo minimo), non a una percentuale a caso.",
          "**Rischio fisso per operazione**: tipicamente 0,5-2% del capitale dedicato al trading. Con l'1%, servono 10 errori di fila per perdere il 10%.",
          "**Rischio/rendimento almeno 1:2**: se rischi 5 punti, il target deve essere ad almeno 10. Così basta avere ragione 1 volta su 3 per non perdere.",
        ],
      },
      {
        tipo: "grafico",
        scenario: "rischio",
        strumenti: ["livelli", "sma20"],
        attivi: ["livelli"],
        didascalia: "Ingresso sulla rottura di 109, stop sotto l'ultimo minimo (99,5), target a due volte il rischio (128).",
      },
      { tipo: "testo", testo: "Prova il calcolatore: cambia lo stop e guarda come cambia il numero di azioni a parità di rischio." },
      { tipo: "calcolatore" },
      {
        tipo: "nvda",
        testo:
          "NVDA si muove spesso del 3-5% in un giorno e anche del 10% dopo una trimestrale. Uno stop troppo stretto viene colpito dal rumore; uno largo impone meno azioni. Il calcolatore ti dice la dimensione coerente con il rischio che hai scelto.",
      },
      {
        tipo: "attenzione",
        testo:
          "**Non mediare al ribasso senza piano**: comprare ancora perché scende trasforma un trade in un investimento non voluto. Un accumulo programmato su un ETF è un'altra cosa.",
      },
    ],
    quiz: [
      {
        domanda: "Capitale 10.000 €, rischio 1%, ingresso 100, stop 95. Quante azioni?",
        opzioni: ["100", "20", "10"],
        corretta: 1,
        spiegazione: "Rischio massimo 100 €, rischio per azione 5 € → 20 azioni.",
      },
      {
        domanda: "Con rischio/rendimento 1:2 costante, che percentuale di successo serve per non perdere?",
        opzioni: ["Circa 34%", "50%", "70%"],
        corretta: 0,
        spiegazione: "1 vittoria (+2) compensa 2 sconfitte (−1 −1): basta vincere 1 volta su 3.",
      },
    ],
  },
  {
    slug: "piano-trading",
    modulo: "tecnica-operativa",
    titolo: "Il piano di trading",
    sottotitolo: "Mettere tutto insieme, ogni giorno",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Un segnale \"forte\" non è un indicatore che lampeggia: è **più ragioni indipendenti che dicono la stessa cosa**. È la regola che usa anche il Radar Mercati: almeno tre conferme, altrimenti niente segnale.",
      },
      {
        tipo: "punti",
        titolo: "Checklist prima di ogni operazione",
        voci: [
          "**1. Trend**: settimanale e giornaliero sono d'accordo? Prezzo sopra o sotto SMA 50 e 200?",
          "**2. Livello**: sono su un supporto, una resistenza rotta, un Fibonacci, una media?",
          "**3. Segnale**: rottura con volumi, pattern confermato, candela di inversione nel posto giusto?",
          "**4. Momentum**: RSI e MACD confermano o divergono?",
          "**5. Calendario**: c'è una trimestrale o un dato macro (Fed, inflazione) nei prossimi giorni?",
          "**6. Rischio**: dove è lo stop, dove il target, R:R almeno 1:2, quante azioni?",
          "**7. Diario**: scrivi perché entri. Rileggerlo è l'unico modo per migliorare.",
        ],
      },
      {
        tipo: "grafico",
        scenario: "laterale",
        strumenti: ["livelli", "volumi", "sma20", "sma50", "rsi", "macd"],
        disegno: true,
        didascalia: "Ripasso: attiva gli indicatori uno alla volta e applica la checklist alla rottura di 120.",
      },
      {
        tipo: "nvda",
        testo:
          "Routine su NVDA: la sera guarda il grafico giornaliero con SMA 50/200, RSI e volumi; segna i livelli; controlla la data della trimestrale. Al mattino confronta con il briefing del Radar Mercati. Se i due giudizi divergono, è una domanda da approfondire, non un'operazione da fare.",
      },
      {
        tipo: "attenzione",
        testo:
          "Il trading è rischioso e la maggior parte dei trader retail perde soldi. Questo corso è formazione: prima di operare con soldi veri prova sul conto demo o su TradingView in paper trading per qualche mese.",
      },
    ],
    quiz: [
      {
        domanda: "Cosa rende \"forte\" un segnale?",
        opzioni: ["Un RSI sotto 30", "Più conferme indipendenti allineate", "Una notizia positiva"],
        corretta: 1,
        spiegazione: "Trend, livello, volumi, momentum e calendario che puntano nella stessa direzione.",
      },
      {
        domanda: "NVDA ha la trimestrale tra 2 giorni e dà un segnale tecnico rialzista. Cosa consideri?",
        opzioni: ["Il segnale è più forte grazie alla trimestrale", "La trimestrale è un evento binario che può invalidare il segnale", "Le trimestrali non contano nell'analisi tecnica"],
        corretta: 1,
        spiegazione: "Un gap dopo i conti può saltare lo stop: molti trader riducono o evitano l'esposizione prima.",
      },
    ],
  },
];

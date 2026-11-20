// Moduli "Come funzionano i mercati", "Aziende e bilanci", "Macro, tassi e
// banche centrali": il vocabolario e i meccanismi per capire un commento
// di mercato o un intervento della Fed.

import type { Lezione } from "./tipi";

export const LEZIONI_MERCATI: Lezione[] = [
  // ───────────── COME FUNZIONANO I MERCATI ─────────────
  {
    slug: "borsa-e-ordini",
    modulo: "mercati",
    titolo: "Come funziona la Borsa",
    sottotitolo: "Azioni, prezzo, ordini, orari",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Un'**azione** è una quota di proprietà di un'azienda. La **Borsa** è il mercato dove queste quote passano di mano: il prezzo non lo decide nessuno, nasce dall'incontro tra chi vuole comprare e chi vuole vendere. Se i compratori sono più decisi dei venditori, il prezzo sale.",
      },
      {
        tipo: "punti",
        titolo: "Le parole di base",
        voci: [
          "**Bid** (denaro): il prezzo più alto che qualcuno offre per comprare. **Ask** (lettera): il prezzo più basso a cui qualcuno vende. La differenza è lo **spread**: più è stretto, più il titolo è **liquido**.",
          "**Capitalizzazione** (market cap): prezzo × numero di azioni. È \"quanto vale l'azienda in Borsa\". Large cap = grandi, small cap = piccole.",
          "**Volume**: quante azioni sono state scambiate. **Liquidità**: quanto è facile comprare e vendere senza muovere il prezzo.",
          "**Long** = comprato, guadagni se sale. **Short** = venduto allo scoperto, guadagni se scende.",
        ],
      },
      {
        tipo: "tabella",
        titolo: "I tipi di ordine",
        intestazioni: ["Ordine", "Cosa fa", "Quando si usa"],
        righe: [
          ["A mercato", "Compra o vende subito al miglior prezzo disponibile", "Quando conta eseguire, non il prezzo esatto"],
          ["Limite", "Compra solo a un prezzo uguale o migliore di quello che fissi", "Per non pagare più del previsto, sui titoli poco liquidi"],
          ["Stop (stop loss)", "Diventa ordine a mercato quando il prezzo tocca il livello", "Per uscire automaticamente se il trade va male"],
          ["Stop limit", "Come lo stop, ma diventa un ordine limite", "Evita esecuzioni pessime, ma può non essere eseguito"],
        ],
      },
      {
        tipo: "tabella",
        titolo: "Orari (ora italiana)",
        intestazioni: ["Mercato", "Contrattazioni continue"],
        righe: [
          ["Borsa di Milano", "9:00 – 17:30"],
          ["Francoforte, Parigi (Xetra, Euronext)", "9:00 – 17:30"],
          ["Wall Street (NYSE, Nasdaq)", "15:30 – 22:00, pre-market e after-hours fuori orario"],
          ["Tokyo", "notte italiana (1:00 – 7:30 circa)"],
        ],
      },
      {
        tipo: "attenzione",
        testo:
          "Per un paio di settimane l'anno (marzo e fine ottobre-novembre) USA ed Europa cambiano l'ora legale in date diverse: Wall Street apre alle 14:30 italiane invece che alle 15:30.",
      },
      {
        tipo: "pratica",
        testo:
          "Apri il book di un titolo sulla tua piattaforma (Fineco lo chiama \"book a 5 livelli\") e guarda bid, ask e quantità. Confronta lo spread di un titolo grande del FTSE MIB con quello di una small cap: capirai cosa vuol dire liquidità.",
      },
    ],
    quiz: [
      {
        domanda: "Bid 10,00, ask 10,04. Compri con un ordine a mercato: a che prezzo, più o meno?",
        opzioni: ["10,00", "10,04", "10,02"],
        corretta: 1,
        spiegazione: "Comprando a mercato accetti il prezzo di chi vende (ask). Lo spread è il costo implicito.",
      },
      {
        domanda: "Un'azienda ha 2 miliardi di azioni a 50 €. Quanto capitalizza?",
        opzioni: ["50 miliardi", "100 miliardi", "2,5 miliardi"],
        corretta: 1,
        spiegazione: "Capitalizzazione = prezzo × numero di azioni = 50 × 2 miliardi.",
      },
      {
        domanda: "Vuoi comprare ma senza pagare più di 25 €. Che ordine usi?",
        opzioni: ["A mercato", "Limite a 25", "Stop a 25"],
        corretta: 1,
        spiegazione: "L'ordine limite fissa il prezzo massimo di acquisto (o minimo di vendita).",
      },
    ],
  },
  {
    slug: "indici-ed-etf",
    modulo: "mercati",
    titolo: "Indici ed ETF",
    sottotitolo: "S&P 500, Nasdaq, FTSE MIB e come si comprano",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Un **indice** è un paniere di titoli che misura l'andamento di un mercato. Quando in TV dicono \"la Borsa oggi è salita\" intendono un indice. Quasi tutti sono **ponderati per capitalizzazione**: le aziende più grandi pesano di più, quindi pochi colossi possono muovere tutto l'indice.",
      },
      {
        tipo: "tabella",
        titolo: "Gli indici che senti nominare",
        intestazioni: ["Indice", "Cosa misura"],
        righe: [
          ["S&P 500", "Le 500 maggiori aziende USA: il riferimento del mercato americano"],
          ["Nasdaq 100", "Le 100 maggiori non finanziarie del Nasdaq: molto tecnologico"],
          ["Dow Jones", "30 grandi aziende USA, ponderato per prezzo (storico, meno rappresentativo)"],
          ["Russell 2000", "Small cap USA: termometro dell'economia domestica americana"],
          ["FTSE MIB", "40 maggiori società di Piazza Affari, molto pesante sulle banche"],
          ["DAX / CAC 40", "Germania / Francia"],
          ["Euro Stoxx 50", "50 big dell'area euro"],
          ["STOXX 600", "600 società europee, utile per i settori europei"],
          ["Nikkei 225", "Giappone"],
          ["MSCI World / ACWI", "Mercati sviluppati / tutto il mondo, inclusi gli emergenti"],
        ],
      },
      {
        tipo: "punti",
        titolo: "ETF in breve",
        voci: [
          "Un **ETF** è un fondo quotato che replica un indice: con un solo acquisto compri tutto il paniere.",
          "**TER**: il costo annuo (es. 0,07%). Più basso è, meglio è.",
          "**Accumulazione** reinveste i dividendi, **distribuzione** li paga.",
          "In Italia si comprano gli ETF **UCITS** (europei): quelli quotati in USA, come SPY o QQQ, di norma non sono acquistabili da un investitore retail europeo.",
          "**Concentrazione**: nell'S&P 500 i primi 10 titoli pesano oltre un terzo. \"Il mercato sale\" a volte vuol dire \"salgono 7 aziende\".",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Cerca su justetf.com un ETF sull'S&P 500 e uno sul FTSE MIB: guarda i primi 10 titoli e il loro peso. Capirai perché una giornata storta di NVIDIA o di Apple si vede subito sull'S&P 500.",
      },
    ],
    quiz: [
      {
        domanda: "Perché pochi titoli possono muovere l'S&P 500?",
        opzioni: ["Perché è ponderato per capitalizzazione", "Perché ha solo 30 titoli", "Non è vero"],
        corretta: 0,
        spiegazione: "Le aziende più grandi hanno più peso: se salgono o scendono, l'indice le segue.",
      },
      {
        domanda: "Il Russell 2000 sale più dell'S&P 500. Che lettura se ne dà spesso?",
        opzioni: ["Le small cap tirano: fiducia nell'economia domestica", "La tecnologia guida il mercato", "Calo dei tassi impossibile"],
        corretta: 0,
        spiegazione: "Le small cap sono più legate all'economia interna USA e al costo del credito: quando sovraperformano il mercato è più ampio e fiducioso.",
      },
    ],
  },
  {
    slug: "settori-e-rotazione",
    modulo: "mercati",
    titolo: "Settori e rotazione",
    sottotitolo: "Ciclici, difensivi, growth, value",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Il mercato si divide in **11 settori** (classificazione GICS). I soldi si spostano continuamente da un settore all'altro a seconda di cosa si aspettano gli investitori su economia, tassi e inflazione: si chiama **rotazione settoriale**. Capirla ti dice cosa sta \"pensando\" il mercato.",
      },
      {
        tipo: "tabella",
        intestazioni: ["Settore (ETF USA)", "Natura", "Cosa lo muove"],
        righe: [
          ["Tecnologia (XLK)", "Growth / ciclico", "Crescita utili, tassi (più bassi = meglio), AI"],
          ["Comunicazioni (XLC)", "Growth", "Pubblicità, Google, Meta, Netflix"],
          ["Consumi discrezionali (XLY)", "Ciclico", "Fiducia e reddito dei consumatori, Amazon, Tesla"],
          ["Finanziari (XLF)", "Ciclico / value", "Tassi, curva dei rendimenti, credito"],
          ["Industriali (XLI)", "Ciclico", "Investimenti, infrastrutture, difesa, PMI"],
          ["Materiali (XLB)", "Ciclico", "Materie prime, Cina, dollaro"],
          ["Energia (XLE)", "Ciclico / value", "Prezzo del petrolio e del gas"],
          ["Salute (XLV)", "Difensivo", "Farmaci, demografia, regole sui prezzi"],
          ["Beni di prima necessità (XLP)", "Difensivo", "Domanda stabile: cibo, igiene"],
          ["Utility (XLU)", "Difensivo", "Tassi (sensibili come obbligazioni), domanda elettrica"],
          ["Immobiliare (XLRE)", "Sensibile ai tassi", "Costo del debito, affitti"],
        ],
      },
      { tipo: "schema", nome: "ciclo-settori" },
      {
        tipo: "punti",
        titolo: "Come si legge la rotazione",
        voci: [
          "**Difensivi in testa** (utility, staples, salute) mentre l'indice scende: mercato in modalità prudente, **risk-off**.",
          "**Ciclici e small cap in testa**: il mercato scommette su crescita, **risk-on**.",
          "**Growth vs value**: growth (tech) soffre quando i tassi salgono; value (banche, energia) regge meglio.",
          "**Rally stretto**: indice su ma pochi titoli in salita. **Rally ampio**: sale la maggioranza dei titoli, segnale più sano.",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Nel Radar Mercati trovi ogni mattina la mappa degli 11 settori. Per una settimana prova a dire, prima di leggere la riga \"Rotazione\": chi è in testa, chi è in coda, è risk-on o risk-off?",
      },
    ],
    quiz: [
      {
        domanda: "Utility e beni di prima necessità salgono, tecnologia scende. Che mercato è?",
        opzioni: ["Risk-on", "Risk-off, prudente", "Euforico"],
        corretta: 1,
        spiegazione: "I soldi vanno sui settori a domanda stabile: gli investitori si stanno difendendo.",
      },
      {
        domanda: "Quale settore tende a soffrire di più se i tassi salgono molto?",
        opzioni: ["Tecnologia growth", "Energia", "Banche"],
        corretta: 0,
        spiegazione: "Il valore delle growth sta negli utili futuri, che con tassi più alti valgono meno oggi.",
      },
      {
        domanda: "Cosa significa \"rally stretto\"?",
        opzioni: ["L'indice sale grazie a pochi titoli", "Il mercato sale poco", "Salgono solo le small cap"],
        corretta: 0,
        spiegazione: "Ampiezza bassa: la maggior parte dei titoli non partecipa, il rialzo è fragile.",
      },
    ],
  },

  // ───────────── AZIENDE E BILANCI ─────────────
  {
    slug: "trimestrali",
    modulo: "aziende",
    titolo: "Le trimestrali",
    sottotitolo: "Ricavi, EPS, guidance, beat e miss",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Ogni tre mesi le società quotate pubblicano i conti: è la **stagione delle trimestrali** (earnings season), che parte un paio di settimane dopo la fine del trimestre, di solito con le grandi banche USA. Il titolo non reagisce ai numeri in sé, ma alla **differenza tra numeri e attese**.",
      },
      {
        tipo: "punti",
        titolo: "Cosa guardano tutti",
        voci: [
          "**Ricavi** (revenue, \"top line\"): quanto ha venduto.",
          "**EPS** (earnings per share): utile per azione, la \"bottom line\". Spesso è nella versione **adjusted**, cioè senza voci straordinarie.",
          "**Margini**: quanta parte dei ricavi resta come profitto. Margini in calo preoccupano anche con ricavi in crescita.",
          "**Guidance**: le previsioni dell'azienda per i trimestri successivi. Spesso conta **più dei numeri passati**.",
          "**Consensus**: la media delle stime degli analisti. **Beat** = sopra, **miss** = sotto.",
        ],
      },
      {
        tipo: "frasi",
        titolo: "Come lo dicono",
        voci: [
          { frase: "Beat and raise", significato: "Numeri sopra le attese e guidance alzata: lo scenario migliore." },
          { frase: "Beat but guide down", significato: "Trimestre buono ma previsioni deboli: il titolo spesso scende comunque." },
          { frase: "Whisper number", significato: "L'attesa \"vera\" del mercato, più alta del consensus ufficiale. Battere il consensus ma non il whisper delude." },
          { frase: "Sell the news", significato: "Il titolo era salito molto prima dei conti: anche con buoni numeri chi ha guadagnato vende." },
          { frase: "Conference call", significato: "La telefonata con gli analisti dopo i conti: i commenti del CEO muovono il titolo quanto i numeri." },
        ],
      },
      {
        tipo: "nvda",
        testo:
          "NVIDIA pubblica dopo la chiusura di Wall Street (la notte italiana) e l'attenzione va soprattutto ai ricavi del segmento **Data Center** e alla guidance del trimestre successivo. Movimenti del 5-10% il giorno dopo sono frequenti: per questo il briefing ti conta i giorni alla trimestrale.",
      },
    ],
    quiz: [
      {
        domanda: "Un'azienda batte le stime ma taglia la guidance. Reazione più probabile?",
        opzioni: ["Rialzo forte", "Ribasso", "Nessuna reazione"],
        corretta: 1,
        spiegazione: "Il mercato guarda avanti: le previsioni deboli pesano più del trimestre passato.",
      },
      {
        domanda: "Cosa sono gli EPS?",
        opzioni: ["I ricavi totali", "L'utile per azione", "Il dividendo"],
        corretta: 1,
        spiegazione: "Earnings per share: utile netto diviso il numero di azioni.",
      },
    ],
  },
  {
    slug: "valutazione",
    modulo: "aziende",
    titolo: "Quanto vale un'azienda",
    sottotitolo: "P/E, multipli, cassa, dividendi, buyback",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "\"È cara\" o \"è a sconto\" non riguarda il prezzo dell'azione (100 € non è caro di per sé), ma quanto paghi per ogni euro di utili, ricavi o cassa. Per questo si usano i **multipli**.",
      },
      {
        tipo: "tabella",
        intestazioni: ["Multiplo", "Formula", "Lettura"],
        righe: [
          ["P/E", "Prezzo / utile per azione", "Anni di utili attuali per ripagare il prezzo. Per l'S&P 500 la media storica è intorno a 15-17"],
          ["P/E forward", "Prezzo / utile stimato prossimi 12 mesi", "Quello citato più spesso nei commenti"],
          ["PEG", "P/E / crescita utili %", "Corregge il P/E per la crescita: intorno a 1 = prezzo coerente con la crescita"],
          ["P/S", "Capitalizzazione / ricavi", "Per aziende ancora senza utili"],
          ["EV/EBITDA", "Valore d'impresa (con il debito) / margine operativo", "Confronta aziende con debiti diversi"],
          ["Dividend yield", "Dividendo annuo / prezzo", "Rendimento da dividendi"],
          ["FCF yield", "Free cash flow / capitalizzazione", "Quanta cassa vera genera rispetto al prezzo"],
        ],
      },
      {
        tipo: "punti",
        voci: [
          "Un P/E alto non è automaticamente un errore: il mercato paga di più chi **cresce più in fretta**. Conta il confronto con il settore e con la propria storia.",
          "**Espansione dei multipli**: il titolo sale più degli utili perché il mercato è disposto a pagare di più. **Compressione**: il contrario, tipica quando salgono i tassi.",
          "**Buyback**: l'azienda ricompra azioni proprie, quindi meno azioni e utile per azione più alto.",
          "**Free cash flow**: la cassa che resta dopo gli investimenti. Gli utili si possono \"aggiustare\", la cassa molto meno.",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Su stockanalysis.com cerca NVDA e un concorrente (AMD, AVGO): confronta P/E forward e crescita attesa degli utili. Ti servirà per rispondere a chi dice \"NVIDIA è troppo cara\" con dei numeri invece che con un'impressione.",
      },
    ],
    quiz: [
      {
        domanda: "Azione A a 20 € con P/E 40, azione B a 500 € con P/E 12. Quale è \"più cara\"?",
        opzioni: ["B, costa 500 €", "A, paghi 40 volte gli utili", "Uguali"],
        corretta: 1,
        spiegazione: "Il prezzo assoluto non conta: conta quanto paghi per ogni euro di utile.",
      },
      {
        domanda: "Cosa fa un buyback all'utile per azione?",
        opzioni: ["Lo abbassa", "Lo alza, perché ci sono meno azioni", "Niente"],
        corretta: 1,
        spiegazione: "Lo stesso utile diviso per meno azioni dà un EPS più alto.",
      },
    ],
  },

  // ───────────── MACRO, TASSI E BANCHE CENTRALI ─────────────
  {
    slug: "banche-centrali",
    modulo: "macro",
    titolo: "Fed, BCE e tassi",
    sottotitolo: "Perché il mercato pende dalle loro labbra",
    minuti: 9,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Le banche centrali decidono il **costo del denaro**. Tassi alti frenano credito, consumi e inflazione; tassi bassi li stimolano. Il loro peso sui mercati è enorme perché i tassi cambiano il valore di **tutto**: azioni, obbligazioni, case, valute.",
      },
      {
        tipo: "tabella",
        intestazioni: ["", "Fed (USA)", "BCE (area euro)"],
        righe: [
          ["Chi decide", "FOMC, 8 riunioni l'anno", "Consiglio direttivo, 8 riunioni di politica monetaria l'anno"],
          ["Tasso di riferimento", "Fed funds (una forchetta, es. 3,75-4%)", "Tasso sui depositi"],
          ["Mandato", "Doppio: massima occupazione e prezzi stabili", "Stabilità dei prezzi: inflazione al 2% nel medio periodo"],
          ["Da guardare", "Dot plot (previsioni dei membri) a marzo, giugno, settembre e dicembre; conferenza di Powell", "Comunicato e conferenza stampa della presidente"],
        ],
      },
      {
        tipo: "frasi",
        titolo: "Il vocabolario",
        voci: [
          { frase: "Punto base (bp)", significato: "0,01%. \"Taglio di 25 punti base\" = tasso giù dello 0,25%." },
          { frase: "Hawkish (falco)", significato: "Orientato a tassi più alti per combattere l'inflazione. Negativo per le azioni nel breve." },
          { frase: "Dovish (colomba)", significato: "Orientato a tassi più bassi per sostenere crescita e lavoro." },
          { frase: "Data-dependent", significato: "\"Decideremo in base ai dati\": nessun impegno sulle prossime mosse." },
          { frase: "Forward guidance", significato: "Indicazioni sulle mosse future. Il mercato reagisce più a queste che alla decisione del giorno." },
          { frase: "Higher for longer", significato: "Tassi alti più a lungo di quanto sperava il mercato." },
          { frase: "Pivot", significato: "Il cambio di direzione: dal rialzo al taglio dei tassi o viceversa." },
          { frase: "QE / QT", significato: "Quantitative easing: la banca centrale compra titoli e immette liquidità. Quantitative tightening: li lascia scadere e la ritira." },
        ],
      },
      {
        tipo: "punti",
        titolo: "La regola d'oro",
        voci: [
          "Il mercato **anticipa**: i tassi futuri sono già nei prezzi (lo strumento più citato è il **CME FedWatch**, che mostra le probabilità implicite).",
          "Una decisione attesa non muove nulla. Muove la **sorpresa**: un taglio più grande del previsto, un dot plot più alto, un tono diverso in conferenza.",
          "\"Don't fight the Fed\": andare contro la direzione della banca centrale raramente paga.",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Alla prossima riunione Fed apri il CME FedWatch il giorno prima: guarda la probabilità di taglio, pausa o rialzo. Poi confronta con la decisione e con la reazione del Nasdaq durante la conferenza (di solito alle 20:30 italiane).",
      },
    ],
    quiz: [
      {
        domanda: "La Fed taglia di 25 bp come atteso al 95%. Il mercato scende. Perché può succedere?",
        opzioni: ["I tagli fanno sempre scendere le azioni", "Il taglio era già prezzato e i messaggi sul futuro sono stati più falchi", "Errore dei dati"],
        corretta: 1,
        spiegazione: "Conta la sorpresa rispetto alle attese, soprattutto su guidance e dot plot.",
      },
      {
        domanda: "Un membro Fed \"hawkish\" è favorevole a…",
        opzioni: ["tassi più bassi", "tassi più alti o mantenuti alti", "stampare moneta"],
        corretta: 1,
        spiegazione: "Il falco privilegia la lotta all'inflazione.",
      },
      {
        domanda: "Quanto è un taglio di 50 punti base?",
        opzioni: ["0,05%", "0,5%", "5%"],
        corretta: 1,
        spiegazione: "1 punto base = 0,01%, quindi 50 bp = 0,50%.",
      },
    ],
  },
  {
    slug: "obbligazioni-e-rendimenti",
    modulo: "macro",
    titolo: "Obbligazioni e rendimenti",
    sottotitolo: "Treasury, curva, spread BTP-Bund",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Un'obbligazione è un prestito: paghi oggi, ricevi cedole e il capitale a scadenza. Regola fondamentale: **prezzo e rendimento si muovono in direzione opposta**. Se i rendimenti di mercato salgono, i vecchi titoli con cedole più basse valgono meno.",
      },
      {
        tipo: "punti",
        titolo: "I numeri che citano in TV",
        voci: [
          "**Treasury 10 anni**: il rendimento più importante del mondo, base per mutui e per valutare le azioni. Quando sale velocemente la tecnologia di solito soffre.",
          "**Treasury 2 anni**: segue da vicino le attese sui tassi della Fed.",
          "**Spread BTP-Bund**: differenza tra il rendimento dei titoli di Stato italiani e tedeschi a 10 anni. Misura il rischio Italia: se si allarga soffrono banche italiane e FTSE MIB.",
          "**Duration**: quanto un'obbligazione è sensibile ai tassi. Più è lunga la scadenza, più il prezzo si muove.",
          "**Spread di credito / high yield**: quanto rendono in più le aziende rispetto allo Stato. Si allarga quando cresce la paura di fallimenti.",
        ],
      },
      { tipo: "schema", nome: "curva-rendimenti" },
      {
        tipo: "punti",
        titolo: "La curva dei rendimenti",
        voci: [
          "**Normale**: i rendimenti lunghi sono più alti di quelli brevi (prestare per più tempo richiede un premio).",
          "**Invertita** (2 anni sopra 10 anni): il mercato si aspetta tagli futuri perché vede rallentamento. Storicamente ha preceduto molte recessioni USA, ma con ritardi lunghi e non come regola meccanica.",
          "**Steepening** (si irripidisce) e **flattening** (si appiattisce): come cambia la distanza tra breve e lungo. Una curva più ripida aiuta le banche, che prendono a prestito a breve e prestano a lungo.",
        ],
      },
    ],
    quiz: [
      {
        domanda: "I rendimenti di mercato salgono. Cosa succede al prezzo dei BTP che hai già?",
        opzioni: ["Sale", "Scende", "Resta uguale"],
        corretta: 1,
        spiegazione: "Prezzo e rendimento sono inversi: il tuo BTP rende meno di quelli nuovi, quindi vale meno.",
      },
      {
        domanda: "Lo spread BTP-Bund passa da 100 a 180. Cosa indica?",
        opzioni: ["Più fiducia nell'Italia", "Più rischio percepito sull'Italia", "Tassi BCE più bassi"],
        corretta: 1,
        spiegazione: "Gli investitori chiedono più rendimento per prestare all'Italia rispetto alla Germania.",
      },
      {
        domanda: "Curva invertita significa…",
        opzioni: ["rendimenti a breve sopra quelli a lungo", "Borsa in rialzo", "inflazione a zero"],
        corretta: 0,
        spiegazione: "Il mercato si aspetta tassi più bassi in futuro, tipicamente per un rallentamento.",
      },
    ],
  },
  {
    slug: "dati-macro",
    modulo: "macro",
    titolo: "I dati macro",
    sottotitolo: "Inflazione, lavoro, PMI, PIL",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Ogni settimana escono dati economici che possono muovere tutto il mercato in pochi secondi. Come per le trimestrali, conta la **sorpresa rispetto alle attese**, non il numero assoluto. Molti dati USA escono alle **14:30 italiane**.",
      },
      {
        tipo: "tabella",
        intestazioni: ["Dato", "Cosa misura", "Perché conta"],
        righe: [
          ["CPI / core CPI", "Inflazione al consumo (core = senza cibo ed energia)", "Il dato che più cambia le attese sulla Fed"],
          ["PCE", "Inflazione preferita dalla Fed", "Obiettivo 2%"],
          ["Non-farm payrolls (NFP)", "Nuovi posti di lavoro USA, primo venerdì del mese", "Mercato del lavoro forte = meno tagli"],
          ["Tasso di disoccupazione", "Persone senza lavoro sulla forza lavoro", "Se sale in fretta è un campanello di recessione"],
          ["Richieste sussidi (jobless claims)", "Settimanale, ogni giovedì", "Segnale rapido sul lavoro"],
          ["PMI / ISM", "Fiducia dei responsabili acquisti", "Sopra 50 = espansione, sotto 50 = contrazione"],
          ["PIL (GDP)", "Crescita dell'economia, trimestrale", "Due trimestri negativi = \"recessione tecnica\""],
          ["Vendite al dettaglio", "Spesa dei consumatori", "I consumi sono circa due terzi del PIL USA"],
        ],
      },
      {
        tipo: "punti",
        titolo: "Il paradosso",
        voci: [
          "**Good news is bad news**: un dato sul lavoro molto forte può far scendere la Borsa perché allontana i tagli dei tassi.",
          "**Bad news is bad news**: quando il mercato teme la recessione, un dato debole fa scendere tutto.",
          "Capire quale dei due regimi è in corso è metà del lavoro di chi commenta i mercati.",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Apri il calendario economico di investing.com, filtra USA ed Eurozona con importanza alta. Per il prossimo CPI segna la stima e, all'uscita, guarda il Nasdaq nei 5 minuti dopo le 14:30.",
      },
    ],
    quiz: [
      {
        domanda: "Il PMI manifatturiero esce a 47. Cosa indica?",
        opzioni: ["Espansione", "Contrazione", "Inflazione al 47%"],
        corretta: 1,
        spiegazione: "La soglia è 50: sotto indica contrazione dell'attività.",
      },
      {
        domanda: "Il CPI esce sopra le attese. Reazione tipica di Nasdaq e rendimenti?",
        opzioni: ["Nasdaq su, rendimenti giù", "Nasdaq giù, rendimenti su", "Nessuna"],
        corretta: 1,
        spiegazione: "Più inflazione significa meno tagli e tassi più alti, il che pesa sui titoli growth.",
      },
    ],
  },
  {
    slug: "ciclo-economico",
    modulo: "macro",
    titolo: "Il ciclo economico",
    sottotitolo: "Soft landing, recessione, stagflazione",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "L'economia alterna fasi: **espansione**, **picco**, **rallentamento o recessione**, **ripresa**. La Borsa anticipa l'economia di 6-9 mesi: spesso tocca il fondo mentre le notizie sono ancora pessime, e il massimo quando sembrano ottime.",
      },
      {
        tipo: "frasi",
        voci: [
          { frase: "Soft landing", significato: "Atterraggio morbido: l'inflazione scende senza recessione. Lo scenario ideale." },
          { frase: "Hard landing", significato: "Atterraggio duro: per fermare l'inflazione l'economia finisce in recessione." },
          { frase: "Stagflazione", significato: "Crescita debole e inflazione alta insieme: il caso peggiore, perché la banca centrale non può aiutare." },
          { frase: "Goldilocks", significato: "Economia \"né troppo calda né troppo fredda\": crescita discreta, inflazione bassa. Ottimo per le azioni." },
          { frase: "Recessione tecnica", significato: "Due trimestri consecutivi di PIL negativo. Negli USA la data ufficiale la stabilisce il NBER con criteri più ampi." },
        ],
      },
      {
        tipo: "punti",
        voci: [
          "**Bull market** (mercato toro): rialzo prolungato. **Bear market** (orso): calo di almeno il 20% dai massimi. **Correzione**: calo del 10-20%.",
          "Riconoscere la fase ti dice quali settori sono favoriti (vedi la lezione sulla rotazione).",
        ],
      },
    ],
    quiz: [
      {
        domanda: "L'S&P 500 è sceso del 22% dal massimo. Come si chiama?",
        opzioni: ["Correzione", "Bear market", "Flash crash"],
        corretta: 1,
        spiegazione: "La convenzione è: -10% correzione, -20% mercato orso.",
      },
      {
        domanda: "Perché la Borsa può salire mentre l'economia è ancora in recessione?",
        opzioni: ["Perché anticipa la ripresa", "Per errore", "Perché i dati sono sbagliati"],
        corretta: 0,
        spiegazione: "I prezzi riflettono le attese sugli utili futuri, non la situazione di oggi.",
      },
    ],
  },
  {
    slug: "valute-materie-prime",
    modulo: "macro",
    titolo: "Valute, materie prime, crypto",
    sottotitolo: "Dollaro, oro, petrolio, rame, Bitcoin",
    minuti: 7,
    blocchi: [
      {
        tipo: "punti",
        titolo: "Il dollaro",
        voci: [
          "**DXY**: forza del dollaro contro un paniere di valute. Dollaro forte = pressione su emergenti e materie prime.",
          "**EUR/USD a 1,10** = 1 euro compra 1,10 dollari. Se sale, l'euro si rafforza.",
          "**Per te che investi in euro su titoli USA**: se il dollaro si indebolisce, il tuo NVDA vale meno in euro anche a parità di prezzo in dollari. Il cambio è un rischio in più (o un aiuto).",
          "**Carry trade**: prendere a prestito in una valuta a tasso basso (storicamente lo yen) per investire dove rende di più. Quando si smonta di colpo può causare vendite a catena.",
        ],
      },
      {
        tipo: "tabella",
        intestazioni: ["Asset", "Cosa lo muove", "Cosa racconta"],
        righe: [
          ["Oro", "Paura, tassi reali (più bassi = meglio), acquisti delle banche centrali, dollaro", "Bene rifugio: sale con l'incertezza"],
          ["Petrolio (Brent, WTI)", "OPEC+, geopolitica, domanda globale", "Inflazione e crescita: su = più inflazione"],
          ["Gas (TTF)", "Riferimento europeo, meteo e forniture", "Costi energetici per l'Europa"],
          ["Rame", "Costruzioni, elettrificazione, Cina", "\"Dottor Rame\": anticipa la salute dell'economia"],
          ["Bitcoin", "Liquidità, appetito per il rischio, flussi negli ETF", "Spesso si muove come un asset ad alto rischio, insieme al Nasdaq"],
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Il tuo rendimento su NVDA in euro ≈ rendimento in dollari + variazione del dollaro contro l'euro. Se NVDA fa +10% e il dollaro perde il 5% sull'euro, tu fai circa +5%.",
      },
    ],
    quiz: [
      {
        domanda: "EUR/USD passa da 1,05 a 1,15. Hai azioni USA. Cosa succede al loro valore in euro, a parità di prezzo?",
        opzioni: ["Sale", "Scende", "Uguale"],
        corretta: 1,
        spiegazione: "L'euro si è rafforzato: gli stessi dollari valgono meno euro.",
      },
      {
        domanda: "Perché il rame viene chiamato \"Dottor Rame\"?",
        opzioni: ["È usato in medicina", "La sua domanda anticipa la salute dell'economia", "È il metallo più caro"],
        corretta: 1,
        spiegazione: "È ovunque (edilizia, reti, elettronica): il suo prezzo riflette l'attività economica.",
      },
    ],
  },
];

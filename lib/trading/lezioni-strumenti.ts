// Moduli "Strumenti, portafoglio e testa" e "Parlare di mercati": sentiment,
// derivati, portafoglio, psicologia, tasse, e il gergo per capire (e
// sostenere) una discussione o un commento televisivo.

import type { Lezione } from "./tipi";

export const LEZIONI_STRUMENTI: Lezione[] = [
  // ───────────── STRUMENTI, PORTAFOGLIO E TESTA ─────────────
  {
    slug: "sentiment-volatilita",
    modulo: "strumenti",
    titolo: "Sentiment e volatilità",
    sottotitolo: "VIX, paura, euforia, \"già prezzato\"",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "I prezzi non riflettono solo i fatti ma anche le **emozioni** di chi compra e vende. Misurare il sentiment aiuta a capire quando il mercato è troppo ottimista o troppo spaventato. Gli estremi di solito non durano.",
      },
      {
        tipo: "tabella",
        intestazioni: ["Indicatore", "Cosa misura", "Lettura"],
        righe: [
          ["VIX", "Volatilità attesa sull'S&P 500 nei prossimi 30 giorni, dalle opzioni", "Sotto 15 calma, 20-30 tensione, sopra 30 paura forte"],
          ["Fear & Greed (CNN)", "Mix di 7 indicatori, scala 0-100", "Estrema paura o estrema avidità"],
          ["Sondaggio AAII", "Quanti investitori retail sono ottimisti o pessimisti", "Spesso usato \"al contrario\""],
          ["Put/call ratio", "Opzioni di protezione contro opzioni rialziste", "Alto = molta copertura, paura"],
        ],
      },
      {
        tipo: "frasi",
        voci: [
          { frase: "Già prezzato (priced in)", significato: "La notizia era attesa e il prezzo la includeva già: arrivata, non muove nulla." },
          { frase: "Buy the rumor, sell the news", significato: "Si compra sull'attesa e si vende quando la notizia esce." },
          { frase: "Capitolazione", significato: "Vendite di panico con volumi enormi: chi doveva arrendersi lo ha fatto, spesso vicino a un minimo." },
          { frase: "Contrarian", significato: "Chi va contro il sentimento prevalente: compra nella paura, vende nell'euforia." },
          { frase: "FOMO", significato: "Fear of missing out: comprare per paura di restare fuori, di solito tardi." },
        ],
      },
    ],
    quiz: [
      {
        domanda: "Il VIX passa da 14 a 35 in una settimana. Cosa è successo?",
        opzioni: ["Il mercato è euforico", "È esplosa la paura e la volatilità attesa", "I volumi sono crollati"],
        corretta: 1,
        spiegazione: "Il VIX sale quando gli operatori pagano caro per proteggersi da forti ribassi.",
      },
      {
        domanda: "Una notizia positiva attesa da settimane esce e il titolo scende. Perché?",
        opzioni: ["Era già prezzata: sell the news", "Errore del mercato", "Il titolo è stato sospeso"],
        corretta: 0,
        spiegazione: "Chi aveva comprato in anticipo incassa: non ci sono nuovi compratori sorpresi.",
      },
    ],
  },
  {
    slug: "derivati-e-leva",
    modulo: "strumenti",
    titolo: "Derivati, short e leva",
    sottotitolo: "Opzioni, future, CFD, short squeeze",
    minuti: 9,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Un **derivato** è un contratto il cui valore dipende da un altro asset (un'azione, un indice, il petrolio). Non serve usarli per capirli: le opzioni e i future muovono il mercato e se ne parla continuamente.",
      },
      {
        tipo: "tabella",
        intestazioni: ["Strumento", "Cos'è", "Rischio"],
        righe: [
          ["Future", "Impegno a comprare o vendere a un prezzo fissato a una data futura. Il \"future sull'S&P\" mostra come aprirà Wall Street", "Leva: piccoli movimenti, grandi perdite o guadagni"],
          ["Opzione call", "Diritto (non obbligo) di comprare a un prezzo fissato (strike) entro una scadenza", "Chi compra rischia solo il premio"],
          ["Opzione put", "Diritto di vendere a un prezzo fissato: usata per proteggersi dai ribassi", "Chi la vende si espone a perdite ampie"],
          ["CFD", "Contratto che replica il prezzo con leva, offerto dai broker", "La maggioranza dei conti retail perde soldi: i broker sono obbligati a dichiararlo"],
          ["Certificati", "Prodotti strutturati bancari con payoff predefiniti", "Complessi, costi spesso poco visibili"],
        ],
      },
      {
        tipo: "punti",
        titolo: "Parole che senti spesso",
        voci: [
          "**Short selling**: vendere un titolo preso in prestito sperando di ricomprarlo più in basso. Perdita teoricamente illimitata.",
          "**Short squeeze**: un titolo molto shortato sale, gli short sono costretti a ricomprare e il rialzo si autoalimenta.",
          "**Leva**: con leva 5, un -20% azzera il capitale. **Margin call**: il broker chiede altri soldi o chiude la posizione.",
          "**Volatilità implicita**: quanto movimento prezzano le opzioni. Prima delle trimestrali sale (si dice anche \"il mercato prezza un movimento del ±8%\").",
          "**Scadenze tecniche**: il terzo venerdì di ogni mese scadono le opzioni; a marzo, giugno, settembre e dicembre anche i future (le \"tre streghe\"), con volumi e oscillazioni anomale.",
        ],
      },
      {
        tipo: "attenzione",
        testo:
          "Leva e derivati amplificano gli errori più dei guadagni, perché tagliano il tempo a disposizione per avere ragione. Impara prima a gestire il rischio sulle azioni senza leva.",
      },
    ],
    quiz: [
      {
        domanda: "Compri una call su un titolo. Qual è la perdita massima?",
        opzioni: ["Illimitata", "Il premio pagato", "Il prezzo dell'azione"],
        corretta: 1,
        spiegazione: "Chi compra un'opzione può perdere al massimo quello che ha pagato.",
      },
      {
        domanda: "Cosa provoca uno short squeeze?",
        opzioni: ["Gli short ricomprano in massa e spingono su il prezzo", "Le banche centrali", "Un calo dei volumi"],
        corretta: 0,
        spiegazione: "Chi ha venduto allo scoperto deve ricomprare per limitare le perdite, alimentando il rialzo.",
      },
    ],
  },
  {
    slug: "portafoglio",
    modulo: "strumenti",
    titolo: "Portafoglio e diversificazione",
    sottotitolo: "Correlazione, allocazione, concentrazione",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Il trading è una parte; la base per la maggior parte delle persone è un **portafoglio** pensato per anni. La domanda chiave non è \"quanto può salire?\" ma \"quanto posso perdere senza cambiare piano?\".",
      },
      {
        tipo: "punti",
        voci: [
          "**Diversificazione**: possedere cose che non scendono tutte insieme. Dieci titoli tech non sono diversificati.",
          "**Correlazione**: quanto due asset si muovono insieme (da -1 a +1). NVDA, AMD e il Nasdaq sono molto correlati.",
          "**Asset allocation**: quanto in azioni, obbligazioni, liquidità, altro. Spiega gran parte dei risultati di lungo periodo.",
          "**Ribilanciamento**: riportare periodicamente i pesi all'obiettivo. Ti costringe a vendere ciò che è salito di più.",
          "**Drawdown**: la perdita dal massimo. Dopo un -50% serve un +100% per tornare in pari.",
          "**PAC**: investire una cifra fissa a intervalli regolari: riduce il rischio di entrare tutto nel momento sbagliato.",
          "**Rischio di concentrazione**: una sola posizione grande (per esempio NVDA) può dominare tutto il portafoglio. Sapere che peso ha è il primo passo.",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Nel modulo Investimenti di Radar guarda quanto pesa ogni posizione sul totale. Se una sola supera il 20-25%, chiediti se è una scelta consapevole.",
      },
    ],
    quiz: [
      {
        domanda: "Perdi il 50%. Quanto devi guadagnare per tornare in pari?",
        opzioni: ["50%", "100%", "75%"],
        corretta: 1,
        spiegazione: "Da 100 a 50 serve raddoppiare: 50 × 2 = 100.",
      },
      {
        domanda: "Hai NVDA, AMD e un ETF Nasdaq. Sei diversificato?",
        opzioni: ["Sì, sono tre strumenti", "Poco: sono molto correlati", "Sì, perché c'è un ETF"],
        corretta: 1,
        spiegazione: "In un giorno negativo per la tecnologia scendono tutti insieme.",
      },
    ],
  },
  {
    slug: "psicologia",
    modulo: "strumenti",
    titolo: "Psicologia del trader",
    sottotitolo: "I bias che costano soldi",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "La maggior parte degli errori non dipende dalla tecnica ma dalla testa. Conoscere i **bias cognitivi** non li elimina, ma ti aiuta a riconoscerli mentre succedono.",
      },
      {
        tipo: "tabella",
        intestazioni: ["Bias", "Come si presenta"],
        righe: [
          ["Avversione alla perdita", "Tieni i perdenti \"finché tornano in pari\" e vendi subito i vincenti"],
          ["Bias di conferma", "Cerchi solo notizie che danno ragione alla tua posizione"],
          ["Ancoraggio", "\"Era a 150, a 120 è un affare\": il vecchio prezzo non conta"],
          ["Recency", "Pensi che ciò che è successo di recente continuerà per sempre"],
          ["Eccesso di fiducia", "Dopo qualche trade vincente aumenti il rischio"],
          ["FOMO", "Entri tardi su un titolo già salito molto perché ne parlano tutti"],
          ["Sunk cost", "Aggiungi soldi a una posizione sbagliata per giustificare quelli già persi"],
        ],
      },
      {
        tipo: "punti",
        titolo: "Antidoti pratici",
        voci: [
          "Decidi **stop e target prima** di entrare, e scrivili.",
          "Tieni un **diario**: data, motivo, uscita, cosa hai imparato.",
          "Rischio fisso per operazione: impedisce a una giornata storta di diventare un disastro.",
          "Se una notizia ti fa venire voglia di agire subito, aspetta la chiusura.",
        ],
      },
    ],
    quiz: [
      {
        domanda: "\"Non vendo finché non torna al prezzo a cui l'ho comprata\". Quale bias?",
        opzioni: ["FOMO", "Ancoraggio e avversione alla perdita", "Bias di conferma"],
        corretta: 1,
        spiegazione: "Il prezzo di carico non interessa al mercato: conta solo la tesi da oggi in avanti.",
      },
    ],
  },
  {
    slug: "tasse",
    modulo: "strumenti",
    titolo: "Tasse sugli investimenti in Italia",
    sottotitolo: "26%, 12,5%, minusvalenze, ETF, crypto",
    minuti: 7,
    blocchi: [
      {
        tipo: "tabella",
        titolo: "Aliquote principali (2026)",
        intestazioni: ["Cosa", "Aliquota"],
        righe: [
          ["Plusvalenze e dividendi su azioni, ETF, obbligazioni societarie", "26%"],
          ["Titoli di Stato italiani e di Paesi \"white list\" (BTP, Bund...)", "12,5%"],
          ["Cripto-attività (plusvalenze realizzate dal 2026)", "33%"],
          ["Imposta di bollo sul dossier titoli", "0,20% annuo del valore"],
        ],
      },
      {
        tipo: "punti",
        voci: [
          "**Regime amministrato**: le tasse le calcola e paga la banca o il broker (tipico di Fineco e delle banche italiane). **Dichiarativo**: le metti tu in dichiarazione (tipico dei broker esteri).",
          "**Minusvalenze** (\"zainetto fiscale\"): le perdite realizzate si possono compensare con plusvalenze future della stessa natura per 4 anni.",
          "**Asimmetria ETF**: i guadagni sugli ETF sono redditi di capitale e **non** si compensano con le minusvalenze; le perdite sugli ETF invece sì, con guadagni su azioni o certificati.",
          "**Dividendi USA**: ritenuta americana (15% con il modulo W-8BEN) più il 26% italiano sul netto, in totale circa il 37%.",
          "Le crypto hanno un comparto a sé: perdite e guadagni si compensano solo tra loro.",
        ],
      },
      {
        tipo: "attenzione",
        testo:
          "Le regole fiscali cambiano spesso: questa lezione è un orientamento aggiornato al 2026. Per casi concreti verifica con il tuo broker o con un commercialista.",
      },
    ],
    quiz: [
      {
        domanda: "Guadagni 1.000 € vendendo un'azione. Quante tasse, in regime amministrato?",
        opzioni: ["125 €", "260 €", "330 €"],
        corretta: 1,
        spiegazione: "Le plusvalenze su azioni sono tassate al 26%.",
      },
      {
        domanda: "Hai 500 € di minusvalenze nello zainetto e guadagni 800 € su un ETF. Puoi compensare?",
        opzioni: ["Sì, paghi solo su 300 €", "No: i guadagni da ETF non si compensano", "Sì, ma solo il 50%"],
        corretta: 1,
        spiegazione: "È l'asimmetria degli ETF: le plusvalenze sono redditi di capitale, tassate per intero.",
      },
    ],
  },

  // ───────────── PARLARE DI MERCATI ─────────────
  {
    slug: "gergo-di-wall-street",
    modulo: "linguaggio",
    titolo: "Il gergo di Wall Street",
    sottotitolo: "Le frasi che senti in TV, decifrate",
    minuti: 9,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "I commentatori parlano per formule. Una volta che le conosci, un intervento di 5 minuti su Class CNBC diventa una sequenza di concetti chiari. Ecco le più comuni, con un esempio d'uso.",
      },
      {
        tipo: "frasi",
        titolo: "Umore del mercato",
        voci: [
          { frase: "Risk-on / risk-off", significato: "Gli investitori cercano rischio (azioni, small cap, crypto) oppure lo evitano (oro, Treasury, difensivi).", esempio: "\"Oggi giornata risk-off: soffrono tech e small cap, salgono oro e utility.\"" },
          { frase: "Flight to quality", significato: "Fuga verso asset sicuri (titoli di Stato tedeschi o USA, oro) quando arriva la paura." },
          { frase: "Wall of worry", significato: "Il mercato sale nonostante le preoccupazioni: \"si arrampica sul muro della paura\"." },
          { frase: "Rally di sollievo", significato: "Rimbalzo dopo che una paura si è rivelata meno grave del previsto." },
          { frase: "Dead cat bounce", significato: "Rimbalzo breve dopo un crollo, seguito da nuovi minimi (\"anche un gatto morto rimbalza\")." },
          { frase: "Buy the dip", significato: "Comprare sui ribassi: funziona nei mercati toro, è pericoloso nei mercati orso." },
          { frase: "Afferrare il coltello che cade", significato: "Comprare un titolo in caduta libera senza segnali di stabilizzazione." },
        ],
      },
      {
        tipo: "frasi",
        titolo: "Struttura del mercato",
        voci: [
          { frase: "Magnificent 7", significato: "Apple, Microsoft, Alphabet, Amazon, Meta, NVIDIA, Tesla: pesano moltissimo sugli indici USA." },
          { frase: "Ampiezza (breadth)", significato: "Quanti titoli partecipano al movimento. \"Breadth debole\" = salgono in pochi." },
          { frase: "Rotazione", significato: "Soldi che passano da un settore o da uno stile (growth, value) all'altro." },
          { frase: "Multipli compressi", significato: "Il mercato paga meno per ogni euro di utili, spesso per tassi più alti." },
          { frase: "Overweight / underweight", significato: "Giudizio di una banca d'affari: sovrappesare o sottopesare un titolo o un settore rispetto all'indice." },
          { frase: "Upgrade / downgrade", significato: "Miglioramento o peggioramento del giudizio di un analista, spesso con un nuovo target price." },
          { frase: "TINA", significato: "\"There is no alternative\": si comprano azioni perché le obbligazioni rendono troppo poco. Vale meno quando i tassi sono alti." },
        ],
      },
      {
        tipo: "frasi",
        titolo: "Proverbi da trading floor",
        voci: [
          { frase: "Don't fight the Fed", significato: "Non andare contro la direzione della banca centrale." },
          { frase: "The trend is your friend", significato: "Opera nella direzione del trend." },
          { frase: "Sell in May and go away", significato: "Detto stagionale: i mesi estivi sarebbero storicamente più deboli. Statisticamente fragile." },
          { frase: "Bull trap / bear trap", significato: "Falsa rottura al rialzo o al ribasso che intrappola chi è entrato." },
          { frase: "Fed put", significato: "L'idea che la Fed intervenga se il mercato crolla troppo, come una \"assicurazione\"." },
        ],
      },
    ],
    quiz: [
      {
        domanda: "\"Oro e Bund salgono, Nasdaq giù del 2%\". Che giornata è?",
        opzioni: ["Risk-on", "Risk-off con flight to quality", "Short squeeze"],
        corretta: 1,
        spiegazione: "I soldi escono dal rischio e cercano asset rifugio.",
      },
      {
        domanda: "Un analista porta un titolo da \"neutral\" a \"overweight\". È…",
        opzioni: ["un downgrade", "un upgrade", "un taglio dei tassi"],
        corretta: 1,
        spiegazione: "Overweight significa consigliare di detenerne più del suo peso nell'indice.",
      },
      {
        domanda: "Un titolo crolla del 40%, rimbalza del 10% e poi fa nuovi minimi. Come si chiama il rimbalzo?",
        opzioni: ["Golden cross", "Dead cat bounce", "Short squeeze"],
        corretta: 1,
        spiegazione: "Un rimbalzo tecnico senza cambio di tendenza.",
      },
    ],
  },
  {
    slug: "fed-speak",
    modulo: "linguaggio",
    titolo: "Capire un discorso della Fed",
    sottotitolo: "Dove sono le parole che muovono i mercati",
    minuti: 8,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "I banchieri centrali scelgono ogni parola con cura, perché il mercato reagisce alle **sfumature**. Gli analisti confrontano il comunicato con il precedente parola per parola: un aggettivo tolto può valere un movimento dell'1% sull'S&P 500.",
      },
      {
        tipo: "frasi",
        titolo: "Frasi tipiche e cosa vogliono dire",
        voci: [
          { frase: "\"Ulteriori progressi sull'inflazione\"", significato: "Non siamo ancora soddisfatti: nessuna fretta di tagliare." },
          { frase: "\"I rischi sono più bilanciati\"", significato: "Preoccupa di nuovo anche la crescita, non solo l'inflazione: si apre la porta a tagli." },
          { frase: "\"Il mercato del lavoro si sta raffreddando\"", significato: "Più spazio per allentare la politica monetaria." },
          { frase: "\"Restrittivi abbastanza a lungo\"", significato: "Higher for longer: tassi alti ancora per un po'." },
          { frase: "\"Pronti ad aggiustare se necessario\"", significato: "Apertura a cambiare rotta: una frase che il mercato legge come colomba." },
          { frase: "\"Decisione presa riunione per riunione\"", significato: "Nessun impegno: ogni dato può cambiare tutto." },
          { frase: "\"Non diamo una guida prestabilita\"", significato: "Non contate su un percorso già deciso dei tassi." },
          { frase: "Dissent", significato: "Uno o più membri hanno votato contro: segnala divisione interna, il mercato lo nota." },
        ],
      },
      {
        tipo: "punti",
        titolo: "Come ascoltare una conferenza stampa",
        voci: [
          "**Prima**: cosa prezza il mercato (FedWatch)? La sorpresa si misura da lì.",
          "**Comunicato**: cosa è cambiato rispetto al precedente? Le agenzie pubblicano il confronto parola per parola.",
          "**Dot plot** (4 volte l'anno): quanti tagli o rialzi vedono i membri? Più o meno di 3 mesi fa?",
          "**Domande dei giornalisti**: è lì che il presidente spesso aggiunge sfumature. I mercati si muovono in diretta.",
          "**Reazione**: guarda insieme Treasury 2 anni, dollaro e Nasdaq. Se il 2 anni scende e il Nasdaq sale, la lettura è \"colomba\".",
        ],
      },
      {
        tipo: "pratica",
        testo:
          "Alla prossima conferenza della BCE o della Fed, tieni aperti il grafico del Treasury 2 anni (o del Bund 2 anni per la BCE) e del cambio EUR/USD. Annota la frase che li ha fatti muovere: è il miglior allenamento per capire questi discorsi.",
      },
    ],
    quiz: [
      {
        domanda: "Il presidente dice \"i rischi sono ora più bilanciati\". Come lo legge il mercato?",
        opzioni: ["Più falco", "Più colomba: si apre spazio ai tagli", "Neutrale"],
        corretta: 1,
        spiegazione: "Se pesa anche la crescita, non solo l'inflazione, la banca centrale può allentare.",
      },
      {
        domanda: "Durante la conferenza il Treasury 2 anni sale e il dollaro si rafforza. Lettura?",
        opzioni: ["Messaggio da falco", "Messaggio da colomba", "Nessun segnale"],
        corretta: 0,
        spiegazione: "Il mercato si aspetta tassi più alti più a lungo.",
      },
    ],
  },
  {
    slug: "leggere-una-notizia",
    modulo: "linguaggio",
    titolo: "Leggere una notizia di mercato",
    sottotitolo: "Target price, consensus, titoli \"che volano\"",
    minuti: 6,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Una notizia finanziaria va scomposta in **fatto**, **attesa** e **reazione**. Il titolo dell'articolo spesso mescola le tre cose e spiega a posteriori un movimento che ha molte cause.",
      },
      {
        tipo: "punti",
        titolo: "Le domande da farsi",
        voci: [
          "**Cosa è successo davvero?** (il dato, la decisione, i conti)",
          "**Cosa si aspettava il mercato?** (consensus, FedWatch, whisper)",
          "**Come ha reagito il prezzo?** E con che volumi? Una reazione forte che rientra in giornata conta meno.",
          "**Chi lo dice e che interesse ha?** Un target price di una banca è un'opinione, spesso rivista in fretta.",
          "**È già nel prezzo?** Se il titolo era salito del 30% in un mese, anche una buona notizia può non bastare.",
        ],
      },
      {
        tipo: "frasi",
        titolo: "Formule da riconoscere",
        voci: [
          { frase: "\"Il titolo vola dopo i conti\"", significato: "Controlla la percentuale: a volte è un +3% che rientra a fine giornata." },
          { frase: "Target price", significato: "Il prezzo a 12 mesi stimato da un analista. È una stima, non una previsione affidabile." },
          { frase: "Consensus", significato: "La media delle stime degli analisti: il metro per dire beat o miss." },
          { frase: "Pre-market / after-hours", significato: "Scambi fuori orario, con pochi volumi: i movimenti possono essere esagerati." },
          { frase: "Prese di profitto", significato: "La spiegazione standard di un calo dopo un rialzo, spesso usata quando non c'è una notizia." },
        ],
      },
    ],
    quiz: [
      {
        domanda: "Un titolo sale del 30% in un mese, i conti sono buoni ma scende del 5%. Spiegazione più probabile?",
        opzioni: ["I conti erano falsi", "Le attese erano già altissime: sell the news", "Un errore di borsa"],
        corretta: 1,
        spiegazione: "Il prezzo incorporava già buone notizie: servivano numeri eccezionali.",
      },
    ],
  },
  {
    slug: "sostenere-una-discussione",
    modulo: "linguaggio",
    titolo: "Sostenere una discussione",
    sottotitolo: "Tesi, catalizzatori, rischi: parlare con cognizione",
    minuti: 7,
    blocchi: [
      {
        tipo: "testo",
        testo:
          "Parlare di mercati con gli amici o in ufficio non vuol dire fare previsioni. Le persone competenti si riconoscono perché **ragionano per scenari** e sanno dire cosa li farebbe cambiare idea.",
      },
      {
        tipo: "punti",
        titolo: "Uno schema in 4 punti per qualsiasi titolo o settore",
        voci: [
          "**Tesi**: perché potrebbe andare bene? (crescita, margini, settore favorito dal ciclo)",
          "**Catalizzatori**: cosa può far muovere il prezzo e quando? (trimestrale, riunione Fed, lancio di un prodotto)",
          "**Rischi**: cosa la smentirebbe? (concorrenza, regole, tassi, valutazione già alta)",
          "**Prezzo**: quanto è già scontato? (multipli rispetto al passato e ai concorrenti, trend tecnico)",
        ],
      },
      {
        tipo: "tabella",
        titolo: "Frasi deboli e frasi forti",
        intestazioni: ["Debole", "Forte"],
        righe: [
          ["\"NVIDIA salirà ancora, l'AI è il futuro\"", "\"La domanda dei data center è forte, ma con un P/E così servono trimestrali sopra le attese: occhio a quella del mese prossimo\""],
          ["\"La Borsa è in bolla\"", "\"Il P/E forward dell'S&P è sopra la media storica e il rialzo è concentrato su pochi titoli: è fragile se i tassi salgono\""],
          ["\"Ho comprato perché scendeva\"", "\"È tornato sul supporto dei 100 con RSI in ipervenduto; esco se chiude sotto 97\""],
          ["\"Le banche vanno bene\"", "\"Con tassi alti e curva più ripida i margini sugli interessi migliorano\""],
        ],
      },
      {
        tipo: "punti",
        titolo: "Domande intelligenti da fare",
        voci: [
          "\"Cosa è già prezzato secondo te?\"",
          "\"Cosa ti farebbe cambiare idea?\"",
          "\"Su che orizzonte: settimane o anni?\"",
          "\"Rispetto a cosa è caro o economico?\"",
        ],
      },
      {
        tipo: "attenzione",
        testo:
          "Gli aneddoti (\"un mio amico ha triplicato con...\") soffrono del survivorship bias: si raccontano i successi, non i fallimenti. Riportare la discussione ai numeri e ai rischi è il modo più credibile di partecipare.",
      },
    ],
    quiz: [
      {
        domanda: "Qual è la frase più solida in una discussione?",
        opzioni: ["\"Questo titolo raddoppia di sicuro\"", "\"La tesi regge finché la crescita ricavi resta sopra il 20%; il rischio è la trimestrale\"", "\"Tutti lo stanno comprando\""],
        corretta: 1,
        spiegazione: "Tesi, condizione e rischio espliciti: è verificabile e mostra che sai cosa guardare.",
      },
      {
        domanda: "Cos'è il survivorship bias?",
        opzioni: ["Considerare solo i casi andati bene", "Un indicatore tecnico", "Un tipo di ordine"],
        corretta: 0,
        spiegazione: "Chi ha perso non lo racconta: il campione che senti è distorto.",
      },
    ],
  },
];

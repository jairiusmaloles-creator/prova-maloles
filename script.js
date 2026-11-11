// Link CSV dei fogli (pubblicati sul web)
const URL_HOME = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZnsAH7iGxLv_j39qB5YySjDTrzeJRCSQM8FnYady_aVg1NoesO5C0prpUrDHYxJLLA7WABmF3Memr/pub?gid=0&single=true&output=csv";
const URL_CV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZnsAH7iGxLv_j39qB5YySjDTrzeJRCSQM8FnYady_aVg1NoesO5C0prpUrDHYxJLLA7WABmF3Memr/pub?gid=251364683&single=true&output=csv";
const URL_STAGE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZnsAH7iGxLv_j39qB5YySjDTrzeJRCSQM8FnYady_aVg1NoesO5C0prpUrDHYxJLLA7WABmF3Memr/pub?gid=1187600150&single=true&output=csv";

// ---------- FUNZIONI RIUTILIZZABILI (valgono per ogni pagina) ----------

// Scarica il CSV e lo trasforma in una lista di oggetti
async function leggiFoglio(url) {
  const risposta = await fetch(url);
  if (!risposta.ok) {
    throw new Error("Errore nel download: " + risposta.status);
  }
  const testo = await risposta.text();
  return csvInOggetti(testo);
}

// Trasforma il testo CSV in oggetti: la prima riga contiene i nomi delle colonne
function csvInOggetti(testo) {
  const righe = [];
  let riga = [];
  let cella = "";
  let traVirgolette = false;

  // Leggo il testo un carattere alla volta
  for (const c of testo) {
    if (c === '"') {
      traVirgolette = !traVirgolette;      // entro/esco da un testo tra virgolette
    } else if (c === "," && !traVirgolette) {
      riga.push(cella);                    // fine cella
      cella = "";
    } else if (c === "\n" && !traVirgolette) {
      riga.push(cella);                    // fine riga
      righe.push(riga);
      riga = [];
      cella = "";
    } else if (c !== "\r") {
      cella += c;                          // carattere normale
    }
  }
  riga.push(cella);                        // ultima riga
  righe.push(riga);

  const intestazioni = righe[0].map(nome => nome.trim());
  const oggetti = [];
  for (let i = 1; i < righe.length; i++) {
    const oggetto = {};
    intestazioni.forEach((nome, posizione) => {
      oggetto[nome] = (righe[i][posizione] || "").trim();
    });
    oggetti.push(oggetto);
  }
  return oggetti;
}

// Mostra un messaggio d'errore al posto della pagina vuota
function mostraErrore(messaggio) {
  const box = document.getElementById("messaggio-errore");
  box.textContent = messaggio;
  box.hidden = false;
}

// ---------- RENDERING DELLA HOME ----------

function mostraHome(dati) {
  // Presentazione: una sola riga
  const pres = dati.find(r => r.sezione === "presentazione");
  if (pres) {
    document.getElementById("nome").textContent = pres.titolo;
    document.getElementById("qualifica").textContent = pres.sottotitolo;
    document.getElementById("testo").textContent = pres.testo;
    document.getElementById("foto").src = "img/" + pres.immagine;
  }

  // Passioni: una card per ogni riga
  const contenitorePassioni = document.getElementById("lista-passioni");
  dati.filter(r => r.sezione === "passione").forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = "img/" + p.immagine;
    img.alt = p.titolo;

    const titolo = document.createElement("h3");
    titolo.textContent = p.titolo;

    const descrizione = document.createElement("p");
    descrizione.textContent = p.testo;

    card.append(img, titolo, descrizione);
    contenitorePassioni.appendChild(card);
  });

  // Competenze: una barra per ogni riga (livello da 0 a 100)
  const contenitoreCompetenze = document.getElementById("lista-competenze");
  dati.filter(r => r.sezione === "competenza").forEach(c => {
    const blocco = document.createElement("div");
    blocco.className = "competenza";

    const nome = document.createElement("p");
    nome.textContent = c.titolo + " (" + c.livello + "%)";

    const barra = document.createElement("div");
    barra.className = "barra";

    const piena = document.createElement("div");
    piena.className = "barra-piena";
    piena.style.width = c.livello + "%";   // la lunghezza dipende dal livello

    barra.appendChild(piena);
    blocco.append(nome, barra);
    contenitoreCompetenze.appendChild(blocco);
  });
}

// ---------- RENDERING DEL CV ----------

// Aggiunge un elemento alla pagina solo se la cella non è vuota
function aggiungiSeNonVuoto(genitore, tag, classe, testo) {
  if (!testo) return;                      // cella vuota: non faccio nulla
  const elemento = document.createElement(tag);
  elemento.className = classe;
  elemento.textContent = testo;            // textContent: testo sicuro, mai HTML
  genitore.appendChild(elemento);
}

// Informazioni personali: titolo = nome dell'informazione, testo = valore
function mostraDatiPersonali(dati) {
  const contenitore = document.getElementById("cv-dati");
  dati.filter(r => r.sezione === "dati").forEach(d => {
    if (!d.titolo || !d.testo) return;     // salto le righe incomplete

    const riga = document.createElement("p");
    riga.className = "dato";

    const nome = document.createElement("strong");
    nome.textContent = d.titolo + ": ";

    const valore = document.createElement("span");
    valore.textContent = d.testo;

    riga.append(nome, valore);
    contenitore.appendChild(riga);
  });
}

// Istruzione ed esperienze: stessa struttura, cambia solo la sezione e il contenitore
function mostraVoci(dati, sezione, idContenitore) {
  const contenitore = document.getElementById(idContenitore);
  dati.filter(r => r.sezione === sezione).forEach(v => {
    const voce = document.createElement("div");
    voce.className = "voce";

    aggiungiSeNonVuoto(voce, "h3", "", v.titolo);
    aggiungiSeNonVuoto(voce, "p", "sottotitolo", v.sottotitolo);
    aggiungiSeNonVuoto(voce, "p", "periodo", v.periodo);
    aggiungiSeNonVuoto(voce, "p", "", v.testo);

    contenitore.appendChild(voce);
  });
}

function mostraCv(dati) {
  mostraDatiPersonali(dati);
  mostraVoci(dati, "istruzione", "cv-istruzione");
  mostraVoci(dati, "esperienza", "cv-esperienze");
}

// ---------- RENDERING DELLA PAGINA STAGE ----------

function mostraStage(dati) {
  const contenitore = document.getElementById("lista-stage");

  // Una riga del foglio = uno stage = un blocco
  dati.forEach(s => {
    if (!s.azienda) return;                  // riga vuota: la salto

    const blocco = document.createElement("article");
    blocco.className = "stage";

    // La card con i dati dell'azienda
    const card = document.createElement("div");
    card.className = "card card-stage";

    // Immagine: la creo solo se la cella non è vuota
    if (s.immagine) {
      const img = document.createElement("img");
      img.src = "img/" + s.immagine;         // nel foglio c'è solo il nome del file
      img.alt = s.azienda;
      card.appendChild(img);
    }

    // Nome dell'azienda, luogo e settore
    aggiungiSeNonVuoto(card, "h3", "", s.azienda);
    aggiungiSeNonVuoto(card, "p", "", s.luogo ? "Luogo: " + s.luogo : "");
    aggiungiSeNonVuoto(card, "p", "", s.settore ? "Settore: " + s.settore : "");

    // Elenco puntato: i punti nella cella sono separati da ";"
    if (s.attivita) {
      aggiungiSeNonVuoto(card, "h4", "", "Di cosa si occupa");
      const elenco = document.createElement("ul");
      s.attivita.split(";").forEach(punto => {
        const testo = punto.trim();          // tolgo gli spazi in più
        if (!testo) return;                  // salto i punti vuoti
        const li = document.createElement("li");
        li.textContent = testo;              // textContent: mai HTML
        elenco.appendChild(li);
      });
      card.appendChild(elenco);
    }

    blocco.appendChild(card);

    // Sotto la card: titolo "Relazione" e testo (solo se la cella non è vuota)
    if (s.relazione) {
      aggiungiSeNonVuoto(blocco, "h3", "", "Relazione");
      aggiungiSeNonVuoto(blocco, "p", "relazione", s.relazione);
    }

    contenitore.appendChild(blocco);
  });
}

// ---------- AVVIO ----------

async function avvia() {
  try {
    // Leggo da <body data-pagina="..."> in quale pagina sono
    const pagina = document.body.dataset.pagina;

    if (pagina === "home") {
      const dati = await leggiFoglio(URL_HOME);
      mostraHome(dati);
    } else if (pagina === "cv") {
      const dati = await leggiFoglio(URL_CV);
      mostraCv(dati);
    } else if (pagina === "stage") {
      const dati = await leggiFoglio(URL_STAGE);
      mostraStage(dati);
    }
  } catch (errore) {
    mostraErrore("Non riesco a caricare i contenuti. Controlla che il foglio sia pubblicato.");
    console.error(errore);
  }
}

avvia();
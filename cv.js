// Link CSV del tab "CV" (stesso foglio della Home, cambia solo il gid)
const URL_CV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZnsAH7iGxLv_j39qB5YySjDTrzeJRCSQM8FnYady_aVg1NoesO5C0prpUrDHYxJLLA7WABmF3Memr/pub?gid=INCOLLA_QUI_IL_GID_DEL_TAB_CV&single=true&output=csv";

// ---------- FUNZIONI COPIATE DALLA HOME (uguali) ----------

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

// ---------- RENDERING DEL CV ----------

// Crea un elemento con del testo e lo aggiunge al contenitore.
// Se il testo è vuoto non fa niente (così le celle vuote non si vedono).
function aggiungiTesto(contenitore, tag, valore, classe) {
  if (!valore) return;
  const elemento = document.createElement(tag);
  elemento.textContent = valore;
  if (classe) elemento.className = classe;
  contenitore.appendChild(elemento);
}

// Informazioni personali: una riga "Nome: valore" per ogni riga "dati"
function mostraDati(dati) {
  const contenitore = document.getElementById("lista-dati");
  dati.filter(r => r.sezione === "dati").forEach(d => {
    if (!d.titolo && !d.testo) return;     // riga completamente vuota

    const paragrafo = document.createElement("p");
    paragrafo.className = "dato";

    if (d.titolo) {
      const nome = document.createElement("strong");
      nome.textContent = d.titolo + (d.testo ? ": " : "");
      paragrafo.appendChild(nome);
    }
    if (d.testo) {
      paragrafo.append(d.testo);           // append con una stringa inserisce solo testo
    }
    contenitore.appendChild(paragrafo);
  });
}

// Istruzione ed esperienze hanno gli stessi campi, quindi uso una sola funzione
function mostraVoci(dati, sezione, idContenitore) {
  const contenitore = document.getElementById(idContenitore);
  dati.filter(r => r.sezione === sezione).forEach(v => {
    const voce = document.createElement("div");
    voce.className = "voce";

    aggiungiTesto(voce, "h3", v.titolo);
    aggiungiTesto(voce, "p", v.sottotitolo, "sottotitolo");
    aggiungiTesto(voce, "p", v.periodo, "periodo");
    aggiungiTesto(voce, "p", v.testo);

    contenitore.appendChild(voce);
  });
}

function mostraCV(dati) {
  mostraDati(dati);
  mostraVoci(dati, "istruzione", "lista-istruzione");
  mostraVoci(dati, "esperienza", "lista-esperienze");
}

// ---------- AVVIO ----------

async function avvia() {
  try {
    const dati = await leggiFoglio(URL_CV);
    mostraCV(dati);
  } catch (errore) {
    mostraErrore("Non riesco a caricare i contenuti. Controlla che il foglio sia pubblicato.");
    console.error(errore);
  }
}

avvia();
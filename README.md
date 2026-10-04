# 🎯 Dutching Pro - Calcolatore Quote & Tracker Supabase

Applicazione Full Stack professionale per il **Dutching di quote manuali**, con **arrotondamento per eccesso o difetto di 5€**, matrice ad alta visibilità con la **% di guadagno/perdita per ciascun esito coperto**, persistenza su database **Supabase** (con fallback automatico su SQLite locale per sviluppo immediato), e tracciamento dello **storico con calcolo delle vincite e riepilogo complessivo aggregato**.

---

## 🚀 Caratteristiche Principali

1. **Configurazione Flessibile del Dutching**:
   - **Bankroll Totale**: predefinito a **1000€**, modificabile liberamente con preset rapidi (250€, 500€, 1000€, 2000€, 5000€).
   - **Numero di Esiti**: predefinito a **5 possibili casi**, facilmente scalabile con pulsanti `+` e `-` da 2 a 12 esiti.
   - **Inserimento Quote Manuale**: quote decimali per ciascun esito con calcolo istantaneo delle probabilità implicite.

2. **Arrotondamento Puntate a Multipli di 5€**:
   - Calcolo delle puntate teoriche per bilanciare i rendimenti.
   - **Arrotondamento automatico a multipli di 5€** (es. 215€, 280€, 195€, 160€, 150€).
   - Possibilità per l'utente di **confermare o modificare manualmente** i singoli importi prima del salvataggio.

3. **Matrice Rendimenti ad Alta Visibilità (in Alto a Schermo)**:
   - Visualizza in tempo reale la **% di profitto o perdita** specifica per ogni esito in base agli importi arrotondati.
   - Colori dinamici: **Verde neon** per rendimenti positivi (`+X.XX%`), **Rosso cremisi** per rendimenti negativi (`-X.XX%`).
   - Importo netto in euro (`+€182.50` / `-€45.00`) e incasso totale atteso.
   - Indicatore del margine dell'allibratore / rilevamento automatico di **Surebet (Arbitraggio)**.

4. **Salvataggio dello Scenario**:
   - Possibilità di assegnare un **nome personalizzato** allo scenario (o utilizzare il segnaposto temporale automatico).
   - Pulsante **"Utilizza Altre Quote"** per azzerare o caricare nuove quote.
   - Pulsante **"Salva Scenario nel Database"** che salva lo scenario e tutti i suoi esiti su Supabase (o SQLite locale).

5. **Storico delle Operazioni & Segnalazione Esito Vincente**:
   - Tab dedicato **"Storico Operazioni"** con badge delle operazioni in attesa.
   - Per ciascun evento è possibile espandere la scheda e cliccare su **"🏆 Segna Vincente"** sull'esito che si è verificato, oppure su *"Nessun esito coperto vincente (Persa)"* o *"Void / Rimborso"*.
   - Ricalcolo istantaneo del profitto netto realizzato e del ROI effettivo.
   - Possibilità di reimpostare in sospeso in caso di errore o eliminare lo scenario.

6. **Riepilogo Complessivo delle Operazioni Concluse**:
   - Sezione in evidenza in cima allo storico con:
     - **Totale Investito Concluso** (€)
     - **Totale Incassato** (€)
     - **Utile Netto Complessivo** (€ e ROI globale %, evidenziato in verde o rosso)
     - **Tasso di Successo / Win Rate** (esiti vincenti su conclusi)
     - **Operazioni in Sospeso** (in attesa di risultato sportivo)

7. **Integrazione Database Supabase**:
   - Supporto nativo al client cloud Supabase tramite variabili d'ambiente o pannello impostazioni integrato nella navbar.
   - Script SQL completo pronto all'uso con tabelle indicizzate e Row Level Security (RLS).
   - Modalità **Zero-Config Fallback** su SQLite locale: l'applicazione funziona immediatamente fin dal primo avvio anche senza chiavi cloud.

---

## 🛠️ Stack Tecnologico

- **Frontend**: React 19, Vite, Vanilla CSS personalizzato (design scuro stile terminale finanziario, glassmorfismo, animazioni fluide, font Google Outfit & JetBrains Mono), Lucide Icons.
- **Backend**: Python 3.14, FastAPI, Uvicorn, Pydantic v2, Python-Dotenv, Supabase Python SDK, HTTPX.
- **Database**: Supabase (PostgreSQL) + Fallback automatico su SQLite locale.

---

## 📁 Struttura del Progetto

```
c:/Users/filin/dutcher/
├── backend/
│   ├── calculator.py          # Logica matematica dutching, arrotondamenti a 5, payout e ROI
│   ├── database.py            # Gestione connessione Supabase e fallback SQLite
│   ├── main.py                # Server FastAPI con endpoint REST
│   ├── models.py              # Schemi dati Pydantic per richieste e risposte
│   ├── requirements.txt       # Dipendenze Python
│   ├── supabase_schema.sql    # Script SQL per creare le tabelle su Supabase
│   ├── .env.example           # File di esempio variabili d'ambiente
│   └── .env                   # Credenziali Supabase locali
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Intestazione con badge e stato DB
│   │   │   ├── ProfitCardsHeader.jsx    # Matrice % guadagno/perdita colorata in verde/rosso
│   │   │   ├── DutchingCalculator.jsx   # Tabella quote, arrotondamento e salvataggio
│   │   │   ├── HistoryView.jsx          # Storico, marcatura vincitore e riepilogo totale
│   │   │   └── SupabaseConfigModal.jsx  # Modale di connessione e script SQL
│   │   ├── services/
│   │   │   └── api.js                   # Client HTTP per il backend FastAPI
│   │   ├── App.jsx                      # Componente principale dell'applicazione
│   │   ├── index.css                    # Design system e foglio di stile scuro
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js                   # Proxy API configurato su http://127.0.0.1:8000
│   └── package.json
└── README.md
```

---

## ⚙️ Istruzioni di Avvio

### 1. Avviare il Backend (FastAPI)

Apri un terminale nella cartella `backend`:
```powershell
cd c:\Users\filin\dutcher\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Il backend sarà attivo su: **http://127.0.0.1:8000**
Documentazione Swagger interattiva su: **http://127.0.0.1:8000/docs**

### 2. Avviare il Frontend (React + Vite)

In un secondo terminale:
```powershell
cd c:\Users\filin\dutcher\frontend
npm.cmd run dev
```
Il frontend sarà accessibile da browser all'indirizzo: **http://localhost:5173**

---

## ☁️ Configurazione Supabase

1. Crea un progetto gratuito su [Supabase](https://supabase.com).
2. Nella dashboard di Supabase, vai nella sezione **SQL Editor** e incolla il contenuto del file [supabase_schema.sql](file:///c:/Users/filin/dutcher/backend/supabase_schema.sql), quindi premi **Run**.
3. Recupera da **Project Settings -> API**:
   - `Project URL`
   - `anon public key` (o `service_role key`)
4. Inseriscile nel file `backend/.env`:
   ```env
   SUPABASE_URL=https://tuo-progetto.supabase.co
   SUPABASE_KEY=tua-chiave-segreta
   ```
   *Oppure inseriscile comodamente dall'interfaccia dell'applicazione cliccando sul pulsante **Database** in alto a destra nella barra di navigazione!*

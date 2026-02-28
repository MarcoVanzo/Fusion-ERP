📘 Guida allo Sviluppo: MV Sport Travel ERP (v2.4)
Questa guida stabilisce gli standard tecnici e architettonici per lo sviluppo e la manutenzione dell'ERP. L'obiettivo è garantire un sistema leggero, sicuro e manutenibile senza dipendenze pesanti.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ARCHITETTURA: MODULARE A LAYER SEPARATI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  NON adottare un'architettura monolitica.

Il sistema è strutturato in layer indipendenti e moduli separati per responsabilità. Ogni dominio (Viaggi, Clienti, Finanza, ecc.) è un modulo autonomo con la propria logica, i propri handler API e il proprio modulo frontend. I moduli comunicano solo tramite interfacce definite (API interne), mai accedendosi direttamente.

Perché NON il monolite:
  • Un monolite accoppia tutto: un bug in un modulo può abbattere l'intero sistema.
  • La manutenzione è difficile: modifiche in un'area richiedono test globali.
  • Non scala: aggiungere nuove funzionalità diventa rischioso nel tempo.

Approccio adottato — Architettura Modulare:
  • Ogni modulo è sviluppato, testato e deployato in modo indipendente.
  • Il backend espone endpoint API per dominio (non un singolo file catch-all).
  • Il frontend carica i moduli JS on-demand (lazy loading per dominio).
  • La comunicazione tra moduli avviene solo via API o eventi definiti, mai con dipendenze dirette.

Struttura delle cartelle:
  /
  ├── api/
  │   ├── router.php           ← Entry point leggero (solo routing + auth)
  │   ├── modules/
  │   │   ├── trips/
  │   │   │   ├── TripsController.php
  │   │   │   └── TripsRepository.php
  │   │   ├── clients/
  │   │   │   ├── ClientsController.php
  │   │   │   └── ClientsRepository.php
  │   │   └── finance/
  │   │       ├── FinanceController.php
  │   │       └── FinanceRepository.php
  │   └── shared/
  │       ├── db.php           ← Connessione PDO singleton
  │       ├── auth.php         ← Verifica sessione e RBAC
  │       └── audit.php        ← Audit log helper
  ├── js/
  │   ├── modules/             ← Un file per dominio (caricato lazy)
  │   │   ├── trips.js
  │   │   ├── clients.js
  │   │   └── finance.js
  │   ├── core/
  │   │   ├── store.js         ← Wrapper fetch + gestione errori
  │   │   ├── router.js        ← Navigazione SPA client-side
  │   │   └── utils.js         ← escapeHtml, formatCurrency, ecc.
  ├── css/
  ├── .env                     ← Credenziali (NON tracciato da Git)
  └── index.html

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. DATABASE & PERSISTENZA (MySQL 8.x)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 Regole d'Oro del Data Design

• Identificativi Personali (ID): Non usare AUTO_INCREMENT numerici per record esposti (es. viaggi, clienti). Usa stringhe prefissate (es. TRIP_ + random_hex(8)). Impedisce il data scraping della concorrenza.
• Gestione Valuta: Usa esclusivamente DECIMAL(15,2). L'uso di FLOAT o DOUBLE è considerato un bug critico.
• Motore: Sempre ENGINE=InnoDB con CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci.
• Integrità: Usa le Foreign Keys. Preferisci ON DELETE CASCADE per sotto-attività e ON DELETE SET NULL per record storici (es. pagamenti di un fornitore eliminato).
• Timestamp: Ogni tabella deve avere created_at DATETIME DEFAULT CURRENT_TIMESTAMP e updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
• Soft Delete: Per record critici (clienti, viaggi) usa deleted_at DATETIME NULL invece di DELETE fisico. Filtrare sempre con WHERE deleted_at IS NULL.

2.2 Nomi e Convenzioni

• Tabelle: snake_case al plurale (trips, audit_logs, payment_items).
• Colonne booleane: usa TINYINT(1) 0/1, non enum('yes','no').
• Colonne stato: usa una colonna status VARCHAR(30) con valori ben documentati (es. 'draft', 'confirmed', 'cancelled').

2.3 Indici

• Aggiungi indici su tutte le colonne usate in WHERE, JOIN o ORDER BY frequenti.
• Evita indici ridondanti (non indicizzare colonne già coperte da una chiave composita).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. BACKEND API (PHP 8.x)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 Routing Stateless

Il file api/api.php è l'unico punto di ingresso. Deve solo:
  1. Validare la sessione (auth.php).
  2. Verificare il permesso RBAC per l'action richiesta.
  3. Smistare la richiesta all'handler specifico.
  4. Restituire sempre JSON con struttura uniforme:
     { "success": true, "data": {...} }
     { "success": false, "error": "Messaggio leggibile" }

3.2 Sicurezza Hardened

  1. Prepared Statements: Obbligatori tramite PDO. Mai concatenare variabili nelle stringhe SQL.
  2. Protezione Sessione: Cookie HttpOnly + Secure + SameSite=Strict. Non usare localStorage per token sensibili (rischio XSS).
  3. Audit Logging: Ogni azione di scrittura (INSERT, UPDATE, DELETE) deve popolare audit_logs con: user_id, action, table_name, record_id, before_snapshot (JSON), after_snapshot (JSON), ip_address, created_at.
  4. Validazione Input: Validare tipo e lunghezza di ogni parametro prima di usarlo. Rifiutare richieste malformate con HTTP 400.
  5. CORS: Impostare Access-Control-Allow-Origin solo al dominio autorizzato. Mai usare *.

3.3 RBAC (Controllo Accessi Basato sui Ruoli)

  Ruoli definiti: admin, manager, operator, readonly.
  • Ogni action deve dichiarare il ruolo minimo richiesto.
  • L'helper auth.php::requireRole('manager') termina la richiesta con 403 se il ruolo è insufficiente.
  • Non fidarsi mai del ruolo inviato dal client: leggerlo sempre dalla sessione server.

3.4 Gestione Errori

  • Tutti gli handler devono essere racchiusi in try/catch.
  • In produzione, non esporre stack trace all'utente: loggare server-side e restituire solo un codice errore generico.
  • Usare codici HTTP corretti: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error.

3.5 Password e Autenticazione

  • Memorizzare le password con password_hash($pwd, PASSWORD_BCRYPT, ['cost' => 12]).
  • Verificare con password_verify($input, $hash).
  • Implementare scadenza password: colonna password_changed_at DATETIME. Forzare il reset dopo 90 giorni.
  • Limitare i tentativi di login: max 5 tentativi per IP ogni 15 minuti (tabella login_attempts).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. FRONTEND & STATE MANAGEMENT (Vanilla JS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 Module Pattern (Incapsulamento)

Ogni sezione (Viaggi, Clienti, Finanza) deve essere un modulo isolato (IIFE) per evitare collisioni nello scope globale.

  const Trips = (() => {
      let _state = []; // Privato

      return {
          async init() {
              UI.loading(true);
              try {
                  _state = await Store.api('list', 'trips');
                  this.render();
              } catch (err) {
                  UI.toast('Errore nel caricamento dei viaggi', 'error');
              } finally {
                  UI.loading(false);
              }
          },
          render() {
              // Usa textContent per dati utente, innerHTML solo per template statici
              const container = document.getElementById('main');
              container.innerHTML = _state.map(t =>
                  `<div>${Utils.escapeHtml(t.nome)}</div>`
              ).join('');
          }
      };
  })();

4.2 UI/UX Principles

• Sanitizzazione: Ogni dato utente renderizzato deve passare per Utils.escapeHtml() per prevenire XSS.
• Feedback: Ogni chiamata asincrona deve mostrare UI.loading(true) prima e UI.toast() al termine (successo o errore).
• Stato vuoto: Ogni lista deve gestire il caso in cui non ci siano dati (messaggio informativo, no schermata vuota).
• Accessibilità: Usare attributi ARIA dove necessario. I bottoni devono avere label descrittive.
• Responsive: Testare su viewport mobile (375px) e desktop (1280px) prima di ogni deploy.

4.3 Gestione Errori Asincroni

  Store.api = async (action, module, payload = {}) => {
      const res = await fetch(`api/api.php?action=${action}&module=${module}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore sconosciuto');
      return json.data;
  };

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. DOCUMENTAZIONE E PDF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.1 Strategia di Generazione

• Client-side (html2pdf.js): Solo per documenti informativi, liste di controllo o report interni temporanei. Non usare per documenti fiscali o legali.
• Server-side (mPDF o TCPDF): Obbligatorio per fatture, contratti e note spese approvate. La generazione lato server garantisce che il documento non sia manipolabile dall'utente nel DOM.

5.2 Nomi File PDF

  Formato: {tipo}_{id}_{YYYYMMDD}.pdf
  Esempi:  fattura_TRIP_a3f8_20250301.pdf
           contratto_CLI_7b2c_20250228.pdf

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. SICUREZZA E SEGRETI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Environment: Tutte le credenziali (DB, API Key Gemini, SMTP) risiedono nel file .env (non tracciato da Git). Usare getenv() o una libreria come vlucas/phpdotenv per leggerle.
• .gitignore: Garantire che .env, /vendor, /uploads e i file di log siano sempre esclusi.
• Rate Limiting: Login e Upload devono avere un limite di tentativi per IP (es. 5 req/15 min) per prevenire Brute Force e DoS.
• Upload Sicuro: Validare MIME type server-side (mai fidarsi dell'estensione). Rinominare il file con un hash. Non salvare in una cartella eseguibile dal web server.
• HTTPS: Obbligatorio in produzione. Reindirizzare HTTP → HTTPS via .htaccess o configurazione server.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Query: Evitare query N+1. Usare JOIN invece di più SELECT in loop.
• Paginazione: Ogni lista che può contenere >50 record deve essere paginata server-side (LIMIT/OFFSET o cursor-based).
• Cache HTTP: Impostare header Cache-Control corretti per asset statici (CSS, JS, immagini).
• Compressione: Abilitare gzip/brotli sul server per le risposte API e HTML.
• Lazy Loading: Caricare i moduli JS solo quando la sezione corrispondente viene attivata.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8. ROADMAP & WORKFLOW DI SVILUPPO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Per ogni nuova feature, seguire questo ordine:

  1. DB First: Crea la tabella, definisci le relazioni e i vincoli (FK, CHECK).
  2. API Handler: Crea le rotte CRUD e definisci i permessi RBAC necessari.
  3. Frontend Module: Sviluppa il modulo JS con init(), render() e gestione errori.
  4. Audit: Verifica che ogni scrittura popoli correttamente audit_logs.
  5. Testing: Verifica con un utente con privilegi minimi (ruolo operator o readonly).
  6. Cache Busting: All'aggiornamento in produzione, incrementa la versione degli asset (es. style.css?v=2.2.1).
  7. Deploy: Aggiorna il changelog e crea un tag Git (es. git tag v2.2.1).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9. ERRORI DA EVITARE (CHECKLIST PRE-COMMIT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SQL & Database
  • [ ] Non usare mai SELECT *. Specifica sempre le colonne necessarie.
  • [ ] Non usare FLOAT/DOUBLE per valori monetari (usa DECIMAL).
  • [ ] Non effettuare query dentro un loop (problema N+1).
  • [ ] Verificare che tutte le query usino Prepared Statements PDO.

  Sicurezza
  • [ ] Non inserire logica di business nei file HTML o JS client-side.
  • [ ] Non salvare password in chiaro (usa password_hash con BCRYPT).
  • [ ] Non esporre stack trace o dettagli DB nelle risposte API.
  • [ ] Non fidarsi del ruolo o dei permessi inviati dal client.
  • [ ] Non caricare file senza validazione MIME server-side.

  Frontend
  • [ ] Non rendere dati utente senza passare per Utils.escapeHtml().
  • [ ] Non ignorare gli errori delle API: ogni chiamata deve avere try/catch e UI.toast().
  • [ ] Non lasciare console.log() attivi in produzione.
  • [ ] Non usare innerHTML con dati non sanitizzati.

  Deploy & Configurazione
  • [ ] Verificare che .env non sia nel repository.
  • [ ] Verificare che i file di log non siano accessibili pubblicamente.
  • [ ] Incrementare la versione degli asset statici prima del deploy.
  • [ ] Testare su browser mobile prima del rilascio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10. STACK TECNOLOGICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questo è lo stack approvato per il progetto. Non introdurre librerie o tecnologie esterne
che non siano presenti in questa lista senza discussione e aggiornamento del documento.

── BACKEND ──────────────────────────────────────────

  Runtime          PHP 8.2+
  Web Server       Apache (con mod_rewrite) o Nginx
  Database         MySQL 8.x
  ORM / DB Layer   PDO nativo (no ORM pesanti come Eloquent o Doctrine)
  Config           vlucas/phpdotenv  →  lettura file .env
  PDF server-side  mPDF 8.x          →  fatture, contratti, note spese
  Email            PHPMailer          →  SMTP con TLS/SSL
  Auth             Sessioni PHP native + cookie HttpOnly/Secure/SameSite=Strict

── FRONTEND ─────────────────────────────────────────

  Linguaggio       Vanilla JavaScript (ES2022+, niente framework)
  Build Tool       Nessuno (no webpack, no vite). Asset serviti direttamente.
  CSS              Vanilla CSS (custom properties per i token di design)
  PDF client-side  html2pdf.js       →  solo per report interni temporanei
  Font             Barlow Condensed, Inter  (Google Fonts)
  Icone            Phosphor Icons o Lucide Icons (SVG inline o CDN)

── DATABASE ─────────────────────────────────────────

  DBMS             MySQL 8.x
  Engine           InnoDB (obbligatorio)
  Charset          utf8mb4 / utf8mb4_unicode_ci
  Migrazione       Script SQL versionati in /db/migrations/ (naming: V001__descrizione.sql)
  Backup           mysqldump schedulato + rotazione 30 giorni

── SICUREZZA & AUTH ─────────────────────────────────

  Hashing          password_hash() con PASSWORD_BCRYPT, cost 12
  Protezione SQL   PDO Prepared Statements (obbligatorio)
  Rate Limiting    Implementazione custom in PHP (tabella login_attempts)
  Sanitizzazione   Utils.escapeHtml() lato client, htmlspecialchars() lato server
  Segreti          File .env (non tracciato da Git)
  HTTPS            Obbligatorio in produzione (Let's Encrypt)

── AI / INTEGRAZIONI ────────────────────────────────

  AI               Google Gemini API (key in .env)
  Uso consentito:  suggerimenti, riepiloghi, OCR documenti
  Uso vietato:     prendere decisioni autonome su dati finanziari o utenti

── DEVOPS & DEPLOY ──────────────────────────────────

  Versionamento    Git (tag semver: v2.4.0)
  Hosting          Server dedicato / VPS con SSH
  Deploy           Script shell manuale o pipeline CI semplice (GitHub Actions)
  Ambienti         development (locale) → staging → production
  Cache busting    Query string versione su asset statici (es. style.css?v=2.4.0)
  Log              File PHP error_log su server + audit_logs su DB

── NON USARE ────────────────────────────────────────

  ✗ Framework PHP pesanti (Laravel, Symfony, CodeIgniter)
  ✗ ORM (Eloquent, Doctrine) — usa PDO diretto
  ✗ JavaScript framework (React, Vue, Angular, Svelte)
  ✗ Node.js runtime lato server
  ✗ FLOAT/DOUBLE per valori monetari
  ✗ localStorage per token o dati sensibili
  ✗ npm / build step (mantieni zero-dependency frontend)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGELOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v2.4 (2026-02-28)
  + Aggiunta sezione 10: Stack Tecnologico completo (backend, frontend, DB, sicurezza, AI, DevOps)
  + Elenco esplicito delle tecnologie vietate

v2.3 (2026-02-28)
  ~ Architettura cambiata da Monolito SPA a Modulare a Layer separati (sezione 1)
  + Motivazione esplicita contro il monolite
  + Struttura cartelle aggiornata per riflettere la separazione per dominio (Controller + Repository)

v2.2 (2026-02-28)
  + Aggiunta struttura cartelle di riferimento (sezione 1)
  + Aggiunto soft delete, timestamp standard e convenzioni nomi DB (sezione 2)
  + Aggiunto RBAC dettagliato, gestione errori HTTP e sicurezza password (sezione 3)
  + Corretto snippet JS: aggiunto try/catch, UI.loading, Utils.escapeHtml (sezione 4)
  + Aggiunto Store.api pattern per gestione errori asincroni (sezione 4.3)
  + Aggiunta convenzione nomi file PDF (sezione 5.2)
  + Aggiunta sezione Performance (sezione 7, nuova)
  + Espansa checklist pre-commit con categorie SQL, Sicurezza, Frontend, Deploy (sezione 9)

v2.1 (precedente)
  Versione iniziale interna.

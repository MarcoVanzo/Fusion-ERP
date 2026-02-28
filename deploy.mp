# Procedura di Deployment su Aruba (www.fusionteamvolley.it/ERP)

Questa procedura descrive i passaggi per aggiornare o pubblicare una nuova versione del gestionale Fusion ERP sullo spazio web di Aruba.

## 1. PREPARAZIONE DEI FILE LOCALI (Mac)
Prima di caricare l'aggiornamento, assicurati che i file locali puntino correttamente all'ambiente di produzione.

1.  **Verifica `.htaccess`**: Assicurati che nel file `/Fusion ERP/.htaccess` la regola di base sia impostata per funzionare nella sottocartella `/ERP/`.
    ```apache
    RewriteEngine On
    RewriteBase /ERP/
    ```

2.  **Verifica / Aggiorna file SQL**: Se hai modificato la struttura del database in locale, assicurati che i nuovi script di migrazione in `/Fusion ERP/db/migrations/` **NON** contengano l'istruzione `USE fusion_erp;` o `CREATE DATABASE` (Aruba non ne consente l'uso diretto tramite file importati). 

3.  **Genera il Pacchetto ZIP**:
    Apri il Terminale del Mac, spostati nella cartella radice del progetto:
    ```bash
    cd "/Users/marcovanzo/Fusion ERP"
    ```
    Quindi esegui il comando per impacchettare tutto ignorando la cartella `.git`:
    ```bash
    rm ../FusionERP_prod.zip; zip -rq ../FusionERP_prod.zip . -x "*.git*"
    ```
    *Questo genererà il file `FusionERP_prod.zip` nella cartella padre (`/Users/marcovanzo/`).*

---

## 2. CARICAMENTO DEI FILE SU ARUBA (Spazio Web)
1.  Accedi all'**Area Clienti Aruba** e vai nel Pannello di Controllo associato a `fusionteamvolley.it`.
2.  In fondo al pannello, apri lo strumento **File Manager** (Gestione File).
3.  Naviga all'interno della cartella principale (es. `www.fusionteamvolley.it`) e poi entra nella sottocartella `/ERP`.
4.  Copia il file `.env` che trovi attualmente online (sezione *Produzione*) sul tuo desktop come backup (così non perdi le credenziali di Aruba).
5.  Usa la funzione **Carica file** per caricare l'ultimo archivio creato (`FusionERP_prod.zip`).
6.  *ATTENZIONE: Se hai intenzione di sostituire tutto il sito, ti consigliamo prima di cancellare i vecchi file (esclusa eventualmente la cartella degli upload `/storage`/`uploads`/`vendor` se si vuole ottimizzare, ma in generale è ok sovrascrivere tutto).*
7.  Seleziona l'archivio ZIP appena caricato e scegli la voce **Estrai** / **Decomprimi**.
8.  Al termine dell'estrazione, cancella il file `FusionERP_prod.zip` per risparmiare spazio sul server.
9.  Ricarica il tuo `.env` di backup (salvato al punto 4) se l'estrazione lo ha sovrascritto, per ripristinare i dati di connessione al database di Aruba. Se la patch prevedeva modifiche al .env, ricordati di fonderle.

---

## 3. AGGIORNAMENTO DEL DATABASE SU ARUBA (SQL)
*Se l'aggiornamento che stai rilasciando comporta anche un aggiornamento del Database:*

1.  Accedi di nuovo all'**Area Clienti Aruba** e apri lo strumento **Database** (Hosting MySQL).
2.  Accedi a **phpMyAdmin** inserendo Username e Password attuali del DB Aruba.
3.  Seleziona il database pertinente (es. `Sql12345_1`) cliccando sul suo nome nel menu a sinistra.
4.  Vai sulla scheda **Importa** nel menu superiore.
5.  Seleziona **solo il nuovo file `.sql`** di migrazione che vuoi eseguire (es. `V005__nuovo_modulo.sql`) precedentemente generato nel Mac in `/db/migrations/` e conferma l'importazione.

## 4. COLLAUDO
Vai sul sito live all'indirizzo [https://www.fusionteamvolley.it/ERP](https://www.fusionteamvolley.it/ERP) per testare le nuove funzionalità.
(Se noti problemi grafici o JS mancanti, istruisci il browser per uno svuotamento forzato della cache `Cmd`+`Shift`+`R` su Mac o Chrome, oppure aggiorna il numero di versione nei caricamenti CSS/JS dentro `index.html` (es. `<script src="js/app.js?v=1.3.0"></script>`).)

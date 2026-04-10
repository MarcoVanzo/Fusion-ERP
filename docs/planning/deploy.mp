# Procedura di Deployment su Aruba (www.fusionteamvolley.it/ERP)

Questa procedura descrive i passaggi per aggiornare o pubblicare una nuova versione del gestionale Fusion ERP sullo spazio web di Aruba.

## DEPLOYMENT AUTOMATIZZATO (SCRIPT PYTHON)
Per semplificare la procedura, il sistema è dotato di uno script automatizzato `deploy.py` che esegue l'upload mirato dei soli file modificati in autonomia.
Inoltre, ad ogni avvio lo script incrementa automaticamente la versione dei file CSS e JS in `index.html` (es. `style.css?v=1740765057`) per evitare problemi di cache obsoleta nel browser degli utenti.

### 1. Prerequisiti
Assicurati di avere le seguenti variabili configurate nel file `/Fusion ERP/.env` locale:
```env
FTP_HOST=ftp.fusionteamvolley.it
FTP_USER=tuoutente@aruba.it
FTP_PASS=pass
FTP_DIR=/www.fusionteamvolley.it/ERP
```

### 2. Upload dei file
Apri il Terminale del Mac, spostati nella cartella radice del progetto:
```bash
cd "/Users/marcovanzo/Fusion ERP"
```
Esegui lo script:
```bash
python3 deploy.py
```

### 3. Opzioni Avanzate (Novità)
Lo script ora supporta parametri per rendere il deploy ancora più veloce:
- `python3 deploy.py --no-build`: Salta la compilazione di React (usa se hai cambiato solo PHP/CSS).
- `python3 deploy.py --no-git`: Salta il caricamento su GitHub (velocizza il deploy diretto).
- `python3 deploy.py --dry-run`: Simula il deploy e mostra quali file verrebbero caricati senza toccare il server.
- `python3 deploy.py --force-build`: Forza la compilazione anche se lo script pensa che non ci siano modifiche.

### 4. Smart Build & Cache
- Lo script calcolerà le differenze rispetto all'ultimo deploy e **caricherà automaticamente via FTP solo i file modificati**.
- **Novità**: Se le cartelle `src` di React non sono cambiate, lo script salterà automaticamente il comando `npm run build`, risparmiando tempo prezioso.
- Al termine, verrà eseguito un **Health Check** automatico sul sito live.

## AGGIORNAMENTO DB (SQL)
*Se l'aggiornamento comporta modifiche a Database:*
1. Apri **phpMyAdmin** su Aruba.
2. Vai in **Importa** e seleziona il nuovo file `.sql` di migrazione generato localmente (non importare script con `USE my_local_db`).

## COLLAUDO
Vai sul sito live all'indirizzo [https://www.fusionteamvolley.it/ERP](https://www.fusionteamvolley.it/ERP) per testare. L'aggiornamento della grafica e logica sarà istantaneo grazie all'auto-busting della cache introdotto nello script di deploy.

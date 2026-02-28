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
- Lo script calcolerà le differenze rispetto all'ultimo deploy e **caricherà automaticamente via FTP solo i file modificati** o aggiunti (inclusa la versione aggiornata di `index.html`).
- Non è più richiesto di caricare e decomprimere manualmente file ZIP sull'Area Clienti Aruba.

## AGGIORNAMENTO DB (SQL)
*Se l'aggiornamento comporta modifiche a Database:*
1. Apri **phpMyAdmin** su Aruba.
2. Vai in **Importa** e seleziona il nuovo file `.sql` di migrazione generato localmente (non importare script con `USE my_local_db`).

## COLLAUDO
Vai sul sito live all'indirizzo [https://www.fusionteamvolley.it/ERP](https://www.fusionteamvolley.it/ERP) per testare. L'aggiornamento della grafica e logica sarà istantaneo grazie all'auto-busting della cache introdotto nello script di deploy.

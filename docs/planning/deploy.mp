# Procedura di Deployment su Aruba (www.fusionteamvolley.it/ERP)

Questa procedura descrive i passaggi per aggiornare o pubblicare una nuova versione del gestionale Fusion ERP sullo spazio web di Aruba.

## DEPLOY AUTOMATIZZATO (SCRIPT UNIFICATO)

Il sistema dispone di due modalità di deploy, entrambe gestite dallo script unificato `scripts/deploy.sh`:

### Modalità 1: HTTP Pull (Default — come MV ERP)
Il server scarica i file direttamente da GitHub usando `deploy_update.php`.
Richiede `DEPLOY_KEY` configurata sia in `.env` locale che nel `.env` sul server.

### Modalità 2: FTP-TLS (Fallback)
Upload diretto dei file via FTP-TLS usando `deploy.py`.
Usare quando il metodo HTTP Pull non è disponibile.

---

## 1. Prerequisiti

Assicurati di avere le seguenti variabili configurate nel file `/Fusion ERP/.env` locale:
```env
# Per HTTP Pull (default)
DEPLOY_KEY=your_secret_deploy_key

# Per FTP-TLS (fallback)
FTP_HOST=ftp.fusionteamvolley.it
FTP_USER=tuoutente@aruba.it
FTP_PASS=pass
FTP_DIR=/www.fusionteamvolley.it/ERP

# Per push su GitHub
GITHUB_TOKEN=ghp_xxx  # opzionale, se il credential helper non funziona
```

La stessa `DEPLOY_KEY` deve essere configurata nel file `.env` sul server Aruba.

## 2. Deploy Standard

### Da Antigravity (Chat)
Scrivi `/deploy` nella chat e lo script parte automaticamente.

### Da Terminale
```bash
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh"
```

Lo script esegue automaticamente:
1. **Genera il manifest** (`generate_manifest.js`)
2. **Pre-flight checks** (PHPStan, Stress Test)
3. **Build React** apps (se modificate)
4. **Cache busting** in `index.html`
5. **Git commit + push** su GitHub
6. **Deploy su Aruba** (HTTP Pull da GitHub)
7. **Health check** sul sito live

## 3. Opzioni Avanzate

```bash
# Deploy standard (HTTP Pull)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh"

# Con messaggio di commit personalizzato
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" "fix: risolto bug login"

# Con migrazione DB
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --migrate

# Con messaggio + migrazione
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" "feat: nuova funzionalità" --migrate

# Via FTP-TLS (fallback)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --ftp

# Dry run (simula senza modificare nulla)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --dry-run

# Salta pre-flight checks
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --skip-checks

# Salta build React (se hai cambiato solo PHP/CSS)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --no-build

# Forza rebuild React
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --force-build
```

## 4. Smart Build & Cache
- Il manifest viene rigenerato automaticamente ad ogni deploy.
- Se le cartelle `src` di React non sono cambiate, la build viene skippata.
- Il cache busting aggiorna automaticamente i parametri `?v=...` nei CSS/JS.
- Il deploy HTTP Pull scarica solo i file presenti nel manifest.
- Il deploy FTP-TLS carica solo i file modificati (confronto hash SHA-256).

## 5. Architettura

```
deploy.sh
  ├── [1] generate_manifest.js  → crea deploy_manifest.json
  ├── [2] PHPStan + Stress Test → controlli pre-deploy
  ├── [3] npm run build         → React apps (se modificate)
  ├── [4] Cache busting         → aggiorna ?v=... in index.html
  ├── [5] git add + commit + push → salva su GitHub
  ├── [6a] HTTP Pull (default)  → curl deploy_update.php
  │     └── Il server scarica i file da GitHub Raw
  ├── [6b] FTP-TLS (--ftp)      → deploy.py upload parallelo
  └── [7] Health check          → verifica sito live
```

## AGGIORNAMENTO DB (SQL)
Le migrazioni possono essere eseguite in due modi:
1. **Automatico**: aggiungi `--migrate` al comando deploy
2. **Manuale**: Apri phpMyAdmin su Aruba e importa il file `.sql`

## COLLAUDO
Vai sul sito live all'indirizzo [https://www.fusionteamvolley.it/ERP](https://www.fusionteamvolley.it/ERP) per testare.
L'aggiornamento della grafica e logica sarà istantaneo grazie all'auto-busting della cache.

## NOTE IMPORTANTI
- ⚠️ **MAI committare la DEPLOY_KEY** nel repository!
- Il file `deploy_update.php` vive **solo sul server** — non viene sovrascritto durante il deploy.
- Il GitHub Actions workflow (`deploy.yml`) può triggerare il deploy anche automaticamente su push a `main`.

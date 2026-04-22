---
description: Deploy dell'ERP in produzione su fusionteamvolley.it
---

# Deploy in Produzione

Esegue tutto in un unico comando: manifest → pre-flight → build → commit → push → deploy server → verifica.

## Steps

// turbo-all

1. Esegui il deploy completo:
```bash
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh"
```
Se nell'output il conteggio errori è **> 0**, controlla i file falliti e investiga.

2. Se sono state modificate tabelle o colonne del DB, esegui anche la migrazione:
```bash
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --migrate
```
Nota: `--migrate` può essere passato anche al primo comando per fare tutto insieme.

3. Se necessario, apri https://www.fusionteamvolley.it/ERP/ nel browser per verificare visivamente.

## Uso diretto da terminale

```bash
# Deploy standard (HTTP Pull — come MV ERP)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh"

# Deploy con messaggio di commit personalizzato
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" "fix: risolto bug login"

# Deploy con migrazione DB
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --migrate

# Deploy con messaggio + migrazione
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" "feat: nuova funzionalità" --migrate

# Deploy via FTP-TLS (fallback se HTTP Pull non funziona)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --ftp

# Dry run (simula senza modifiche)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --dry-run

# Salta pre-flight checks (PHPStan, Stress Test)
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --skip-checks

# Salta build React
bash "/Users/marcovanzo/Fusion ERP/scripts/deploy.sh" --no-build
```

## Note
- La `DEPLOY_KEY` viene letta automaticamente da `.env` — non serve esportare nulla.
- Il manifest viene rigenerato automaticamente ad ogni deploy.
- Se non ci sono modifiche da committare, lo step viene skippato automaticamente.
- Il cache busting sugli hash JS/CSS è gestito sia localmente che server-side.
- ⚠️ MAI committare la deploy key nel repository!
- Per il deploy via FTP-TLS (vecchio metodo), usa il flag `--ftp`.

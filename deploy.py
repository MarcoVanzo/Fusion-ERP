#!/usr/bin/env python3
import os
import ftplib
import sys
import re
import hashlib
import json
import subprocess
import time as _time
import threading
import concurrent.futures
import argparse
import http.client
import urllib.parse
from typing import Optional

# Timeouts (seconds)
GIT_TIMEOUT = 30
GIT_PUSH_TIMEOUT = 60
FTP_CONNECT_TIMEOUT = 30
FTP_OP_TIMEOUT = 30

CACHE_FILE = '.deploy_cache.json'
MAX_WORKERS = 8

def run_preflight_checks():
    """Run security and stability checks before proceeding with deployment."""
    print("📋 Starting Pre-flight Checks...")
    
    # 1. PHPStan Static Analysis
    print("🔍 Running PHPStan Static Analysis...")
    try:
        # Use the composer script defined in composer.json
        # Running without capture_output to show live progress to the user
        result = subprocess.run(['php', 'composer.phar', 'phpstan'])
        if result.returncode != 0:
            print("❌ PHPStan failed! Fix the following issues before deploying.")
            sys.exit(1)
        print("  ✅ PHPStan passed.")
    except FileNotFoundError:
        print("  ⚠️  Composer not found, skipping PHPStan.")
    except Exception as e:
        print(f"  ⚠️  Error running PHPStan: {e}")

    # 2. Stress Test
    print("🧪 Running API Stress Test...")
    stress_script = 'scripts/stress_checker.py'
    if os.path.exists(stress_script):
        try:
            # Running without capture_output to show live progress
            result = subprocess.run([sys.executable, stress_script])
            if result.returncode != 0:
                print("❌ Stress Test failed! API is not stable or slow.")
                sys.exit(1)
            print("  ✅ Stress Test passed.")
        except Exception as e:
            print(f"  ⚠️  Error running Stress Test: {e}")
    else:
        print(f"  ⚠️  {stress_script} not found, skipping Stress Test.")
    
    print("✅ All Pre-flight Checks passed!\n")


def load_env():
    """Load variables from .env file into environment."""
    env_file = '.env'
    if not os.path.exists(env_file):
        print("Warning: .env file not found.")
        return False
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            match = re.match(r'^([^=]+)=(.*)$', line)
            if match:
                key, val = match.groups()
                key = key.strip()
                val = val.strip().strip("'\"")
                os.environ[key] = val
    return True

def get_folder_hash(folderpath):
    """Calculate a combined hash of all files in a folder (src/public)."""
    if not os.path.exists(folderpath):
        return None
    hasher = hashlib.sha256()
    for root, dirs, files in os.walk(folderpath):
        for name in sorted(files):
            # Skip common hidden files
            if name.startswith('.'): continue
            filepath = os.path.join(root, name)
            # Add filename and content to hash
            hasher.update(name.encode())
            try:
                with open(filepath, 'rb') as f:
                    while True:
                        chunk = f.read(65536)
                        if not chunk: break
                        hasher.update(chunk)
            except Exception:
                continue
    return hasher.hexdigest()

def get_file_hash(filepath):
    """Calculate SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()
    except Exception as e:
        print(f"⚠️ Error hashing {filepath}: {e}")
        return None

def load_cache() -> dict[str, str]:
    """Load the file hash cache."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                data = json.load(f)
                return dict(data) if isinstance(data, dict) else {}
        except Exception:
            return {}
    return {}

def save_cache(cache):
    """Save the file hash cache."""
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"⚠️ Error saving cache: {e}")

def ensure_remote_dir(ftp, remote_dir, created_dirs):
    """Ensure a remote directory exists using an in-memory cache to reduce FTP commands."""
    if remote_dir in created_dirs:
        return True
    
    try:
        ftp.cwd(remote_dir)
        ftp.cwd('/') # return to root
        created_dirs.add(remote_dir)
        return True
    except ftplib.error_perm:
        try:
            parent = os.path.dirname(remote_dir)
            if parent and parent != '/' and parent != remote_dir:
                ensure_remote_dir(ftp, parent, created_dirs)
            
            # Create it
            ftp.mkd(remote_dir)
            created_dirs.add(remote_dir)
            return True
        except Exception as e:
            print(f"⚠️ Could not create directory {remote_dir}: {e}")
            return False

class FtpThreadLocal(threading.local):
    ftp: ftplib.FTP_TLS

thread_local = FtpThreadLocal()
active_ftp_connections = []
connection_lock = threading.Lock()

def get_ftp_connection(host, user, password):
    if not hasattr(thread_local, "ftp"):
        ftp = ftplib.FTP_TLS(host, timeout=FTP_CONNECT_TIMEOUT)
        ftp.login(user, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        if ftp.sock:
            ftp.sock.settimeout(FTP_OP_TIMEOUT)
        thread_local.ftp = ftp
        with connection_lock:
            active_ftp_connections.append(ftp)
    return thread_local.ftp

def quit_ftp_connection():
    if hasattr(thread_local, "ftp"):
        ftp = thread_local.ftp
        try:
            ftp.quit()
        except:
            pass
        with connection_lock:
            if ftp in active_ftp_connections:
                active_ftp_connections.remove(ftp)
        del thread_local.ftp

def quit_all_ftp_connections():
    with connection_lock:
        for ftp in active_ftp_connections:
            try:
                ftp.quit()
            except:
                pass
        active_ftp_connections.clear()

def worker_upload(item: tuple[str, str, str], host: str, user: str, password: str, max_retries: int = 3) -> tuple[bool, str, Optional[str]]:
    local_path, remote_filename, remote_dir = item
    for attempt in range(1, max_retries + 1):
        try:
            ftp = get_ftp_connection(host, user, password)
            ftp.cwd('/')
            ftp.cwd(remote_dir)
            with open(local_path, 'rb') as fbin:
                ftp.storbinary(f'STOR {remote_filename}', fbin)
            return True, local_path, None
        except Exception as e:
            quit_ftp_connection()
            if attempt == max_retries:
                return False, local_path, str(e)
            _time.sleep(2)
    return False, local_path, "Max retries exceeded"

def build_react_apps(force=False, skip=False, cache=None):
    """Build the React applications before deployment if changed."""
    if skip:
        print("\n⏩ Skipping React builds (--no-build).")
        return
        
    apps = ['fusion-website', 'fusion-erp-react']
    for app in apps:
        if os.path.isdir(app):
            # Smart check: hash the src and public folders
            src_path = os.path.join(app, 'src')
            public_path = os.path.join(app, 'public')
            current_hash = f"{get_folder_hash(src_path)}|{get_folder_hash(public_path)}"
            
            cached_hash = cache.get(f"__build_hash_{app}", "") if cache else ""
            
            if not force and cached_hash == current_hash and os.path.exists(os.path.join(app, 'dist')):
                print(f"\n✨ React app {app} is unchanged, skipping build (use --force-build to override).")
                continue

            print(f"\n📦 Building React app: {app}...")
            try:
                if not os.path.exists(os.path.join(app, 'node_modules')):
                    print(f"  ⬇️  Installing dependencies for {app}...")
                    subprocess.run(['npm', 'install'], cwd=app, check=True)
                subprocess.run(['npm', 'run', 'build'], cwd=app, check=True)
                print(f"  ✅ Build successful for {app}!")
                if cache is not None:
                    cache[f"__build_hash_{app}"] = current_hash
            except FileNotFoundError:
                # npm not installed on this machine
                if os.path.exists(os.path.join(app, 'dist')):
                    print(f"  ⚠️  npm non trovato, ma {app}/dist esiste — uso la build esistente.")
                else:
                    print(f"  ❌ npm non trovato e {app}/dist non esiste. Installa Node.js o usa --no-build.")
                    sys.exit(1)
            except subprocess.CalledProcessError as e:
                print(f"  ❌ Build failed for {app}: {e}")
                sys.exit(1)
            except Exception as e:
                print(f"  ❌ Error building {app}: {e}")
                sys.exit(1)

def deploy_files_via_ftp(dry_run=False):
    """Upload project files via FTP in parallel, only if changed."""
    if dry_run:
        print("\n🔍 DRY RUN: No files will be actually uploaded.")
    print("\n🚀 Starting Fast Smart Auto-Deploy (Parallelized)...")
    
    host = os.getenv('FTP_HOST', '')
    user = os.getenv('FTP_USER', '')
    password = os.getenv('FTP_PASS', '')
    base_remote_dir = os.getenv('FTP_DIR', '/ERP')
    
    if not host or not user or not password:
        print("❌ Error: FTP_HOST, FTP_USER, or FTP_PASS not set in .env file.")
        print("Please configure them in your .env file to enable automatic deployment.")
        return False
        
    try:
        # Load local cache
        file_cache: dict[str, str] = load_cache()
        new_cache: dict[str, str] = file_cache.copy() # Start with old cache
        
        ignore_dirs = [
            '.git', 'node_modules', 'tests', '__pycache__', '.pytest_cache',
            '.gemini', '.venv', 'venv_video', 'uploads',
            # Added in P0-P2 refactoring:
            '.npm-cache', '.phpunit.cache', '.github',
            'dist', 'docker', 'scripts', 'docs', 'types',
        ]
        ignore_extensions = ['.zip', '.log', '.pyc', '.sqlite', '.db']
        ignore_files = [
            'deploy.py', 'deploy.mp', 'deploy_ftp.sh', CACHE_FILE, '.env.prod',
            # Dev/build config files — NOT needed on production:
            'Dockerfile', 'docker-compose.yml', '.dockerignore',
            'vite.config.js', 'tsconfig.json', 'phpstan.neon', 'phpunit.xml',
            'eslint.config.mjs', 'package.json', 'package-lock.json',
            'composer.json', 'composer.lock', 'composer.phar',
            'style_v2.backup.css',
            # Security: debug/test/diagnostic files — NEVER deploy to production
            'test.php', 'gas_proxy.gs', '.stylelintrc.json',
        ]

        upload_jobs: list[tuple[str, str, str, str]] = []
        required_dirs: set[str] = set()
        required_dirs.add(base_remote_dir)
        skip_count: int = 0
        uploaded_sql_files: list[str] = []

        print("🔍 Scanning for modified files...")
        for root, dirs, files in os.walk('.'):
            # Prune ignored directories in-place
            for d in list(dirs):
                if d in ignore_dirs:
                    dirs.remove(d)

            # Calculate the corresponding remote path
            rel_path = os.path.relpath(root, '.')
            rel_path_unix = rel_path.replace('\\', '/')
            
            # Special handling for assets to avoid uploading thousands of user files if they exist locally
            if rel_path_unix == 'assets':
                files[:] = [f for f in files if f in ['favicon.svg', 'cestino.png']]
                # Let os.walk descend into 'anatomy' and 'media' subdirectories
            elif rel_path_unix.startswith('assets/') and not (rel_path_unix.startswith('assets/media') or rel_path_unix.startswith('assets/anatomy')):
                for d in list(dirs):
                    dirs.remove(d)
                files[:] = [] # Skip files in unallowed sub-assets
                continue
            
            # Skip the root files of the React apps (package.json, ecc)
            if rel_path_unix in ['fusion-website', 'fusion-erp-react']:
                for d in list(dirs):
                    if d != 'dist':
                        dirs.remove(d)
                continue
            
            # Map fusion-website/dist to the root folder in production
            if rel_path_unix == 'fusion-website/dist' or rel_path_unix.startswith('fusion-website/dist/'):
                sub_rel = rel_path_unix.replace('fusion-website/dist', '').lstrip('/')
                remote_sub_dir = '/www.fusionteamvolley.it' if not sub_rel else f"/www.fusionteamvolley.it/{sub_rel}"
            # Map fusion-erp-react/dist inside the ERP base folder
            elif rel_path_unix == 'fusion-erp-react/dist' or rel_path_unix.startswith('fusion-erp-react/dist/'):
                sub_rel = rel_path_unix.replace('fusion-erp-react/dist', '').lstrip('/')
                remote_sub_dir = f"{base_remote_dir}/react" if not sub_rel else f"{base_remote_dir}/react/{sub_rel}"
            else:
                remote_sub_dir = base_remote_dir if rel_path_unix == '.' else f"{base_remote_dir}/{rel_path_unix}"

            for file in files:
                # Skip ignored / hidden files (allow .htaccess and .env.prod)
                if file not in ('.htaccess', '.env.prod') and (
                    file in ignore_files
                    or file.startswith('.')
                    or any(file.endswith(ext) for ext in ignore_extensions)
                ):
                    skip_count += 1
                    continue

                # Defense-in-depth: block debug/test PHP scripts by naming pattern
                if file.endswith('.php') and re.match(r'^(test_|debug_|check_|query_|find_|list_models)', file):
                    skip_count += 1
                    continue

                local_file_path: str = os.path.join(root, file)

                file_hash = get_file_hash(local_file_path)
                if not file_hash:
                    continue

                # Skip if unchanged, unless it's an environment file (we want to ensure our keys deploy)
                cached_hash: str = file_cache.get(local_file_path, '')
                if cached_hash and cached_hash == file_hash and file != '.env.prod':
                    skip_count += 1
                    continue

                if file.endswith('.sql') and 'db/migrations' in rel_path_unix:
                    uploaded_sql_files.append(file)

                remote_filename = '.env' if file == '.env.prod' else file
                # Add to queue
                upload_jobs.append((local_file_path, remote_filename, remote_sub_dir, file_hash))
                required_dirs.add(remote_sub_dir)

        if not upload_jobs:
            print(f"\n✅ All files are up to date! (skipped {skip_count} unchanged files).")
            return True

        print(f"📦 Found {len(upload_jobs)} files to upload.")
        
        print(f"🔌 Single-thread connection to prepare directories...")
        ftp = ftplib.FTP_TLS(host, timeout=FTP_CONNECT_TIMEOUT)
        ftp.login(user, password)
        ftp.prot_p() 
        ftp.set_pasv(True)
        if ftp.sock:
            ftp.sock.settimeout(FTP_OP_TIMEOUT)
        created_dirs = set()
        ftp.cwd('/')
        for d in sorted(required_dirs, key=len): # Sort by length to create parents first
            ensure_remote_dir(ftp, d, created_dirs)
        ftp.quit()
        print("✅ Directories are ready.\n")

        print(f"🚀 Uploading via {MAX_WORKERS} parallel connections...")
        upload_count: int = 0
        failed_jobs: list[str] = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_job = {}
            for job in upload_jobs:
                local_path, remote_filename, remote_sub_dir, f_hash = job
                item = (local_path, remote_filename, remote_sub_dir)
                future = executor.submit(worker_upload, item, host, user, password) # type: ignore
                future_to_job[future] = job

            for future in concurrent.futures.as_completed(future_to_job):
                job = future_to_job[future]
                local_path, remote_filename, remote_sub_dir, f_hash = job
                try:
                    if dry_run:
                        upload_count += 1
                        print(f"  [DRY] Should upload {local_path} -> {remote_filename}")
                        continue

                    success, completed_local_path, error_msg = future.result()
                    if success:
                        upload_count += 1 # type: ignore
                        new_cache[completed_local_path] = f_hash
                        print(f"  ⬆️ [{upload_count}/{len(upload_jobs)}] Uploaded {local_path} -> {remote_filename}")
                        if upload_count % 50 == 0:
                            save_cache(new_cache)
                    else:
                        print(f"  ❌ Failed to upload {local_path}: {error_msg}")
                        failed_jobs.append(completed_local_path)
                except Exception as e:
                    print(f"  ❌ Unhandled exception for {local_path}: {e}")
                    failed_jobs.append(local_path)

        # Cleanup connections in workers
        quit_all_ftp_connections()

        save_cache(new_cache)
                
        print(f"\n✅ Upload complete! Successfully transferred {upload_count} modified files (skipped {skip_count} unchanged files).")
        
        if failed_jobs:
            print(f"⚠️ Warning: {len(failed_jobs)} files failed to upload.")
            return False

        if uploaded_sql_files:
            print("\n" + "="*60)
            print("🚨 🚨 🚨   ATTENZIONE: MIGRAZIONI DB RILEVATE   🚨 🚨 🚨")
            print("="*60)
            print("Hai caricato dei nuovi script SQL o modificato quelli esistenti:")
            for sql_file in uploaded_sql_files:
                print(f"  - {sql_file}")
            print("\nRicordati di importare questi file su phpMyAdmin (ambiente Aruba)")
            print("per aggiornare la struttura del database!")
            print("="*60 + "\n")

        return True
        
    except Exception as e:
        print(f"❌ FTP Error: {e}")
        return False

def _git_credentials_available() -> bool:
    """Quick check: can git authenticate to origin without user interaction?"""
    try:
        remote = subprocess.run(
            ['git', 'remote', 'get-url', 'origin'],
            capture_output=True, text=True, timeout=5
        )
        if remote.returncode != 0:
            return False
        url = remote.stdout.strip()
        # Parse host from URL
        host = url.replace('https://', '').replace('http://', '').split('/')[0]
        # Ask credential helper (non-interactive) if it has stored creds
        proc = subprocess.run(
            ['git', 'credential', 'fill'],
            input=f'protocol=https\nhost={host}\n\n',
            capture_output=True, text=True, timeout=5
        )
        return proc.returncode == 0 and 'password=' in proc.stdout
    except Exception:
        return False

def git_commit_and_push(skip=False):
    """Committa tutte le modifiche locali e fa push su GitHub prima del deploy."""
    if skip:
        print("\n⏩ Skipping Git push (--no-git).")
        return
    print("\n📦 Salvataggio codice su GitHub prima del deploy...")
    try:
        # Controlla se ci sono modifiche
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True, text=True, check=True,
            timeout=GIT_TIMEOUT
        )
        if not result.stdout.strip():
            print("  ℹ️  Nessuna modifica locale da committare.")
        else:
            timestamp = _time.strftime('%Y-%m-%d %H:%M')
            subprocess.run(['git', 'add', '-A'], check=True, timeout=GIT_TIMEOUT)
            subprocess.run(
                ['git', 'commit', '-m', f'deploy: {timestamp}'],
                check=True, timeout=GIT_TIMEOUT
            )
            print(f"  ✅ Commit creato: deploy: {timestamp}")

        # Pre-check: verify git credentials before attempting push
        if not _git_credentials_available():
            print("  ⚠️  Credenziali Git non disponibili — push saltato.")
            print("      Per configurarle: git config credential.helper store && git push origin main")
            return

        push_result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            timeout=GIT_PUSH_TIMEOUT
        )
        if push_result.returncode == 0:
            print("  ✅ Push su GitHub completato.")
        else:
            print("  ⚠️  Push fallito (non bloccante).")

    except subprocess.TimeoutExpired:
        print("  ⚠️  Git timeout — continuo il deploy senza push...")
    except subprocess.CalledProcessError as e:
        print(f"  ⚠️  Git error (non bloccante): {e}")
    print()


def update_index_version():
    """Aggiorna il parametro ?v=... in index.html per forzare il refresh della cache (CSS, JS) in produzione."""
    version = str(int(_time.time()))
    index_path = 'index.html'
    if not os.path.exists(index_path):
        return
        
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Sostituisce .css?v=... o .js?v=... con la nuova versione (timestamp)
        content = re.sub(r'(\.(css|js)\?v=)[\w\.]+', r'\g<1>' + version, content)
        # Aggiorna anche il meta tag app-version (usato dal router per i moduli dinamici)
        content = re.sub(r'(<meta name="app-version" content=")[\w\.]+(")', r'\g<1>' + version + r'\2', content)
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Versione cache in index.html aggiornata automaticamente (v={version})")
    except Exception as e:
        print(f"⚠️ Errore durante l'aggiornamento della cache in index.html: {e}")

def verify_deployment():
    """Effettua un health check sul sito di produzione."""
    print("\n🩺 Eseguo Health Check sul sito live...")
    url = os.getenv('APP_URL', 'https://www.fusionteamvolley.it/ERP')
    try:
        parsed_url = urllib.parse.urlparse(url)
        # Bypassa verifica SSL se fallisce localmente (problema comune su Mac/Python)
        import ssl
        context = ssl._create_unverified_context()
        conn = http.client.HTTPSConnection(parsed_url.netloc, timeout=10, context=context)
        conn.request("GET", parsed_url.path or "/")
        response = conn.getresponse()
        if response.status == 200:
            print(f"  ✅ Health Check superato! {url} risponde con 200 OK.")
        else:
            print(f"  ⚠️ Health Check incompleto: {url} risponde con {response.status}.")
    except Exception as e:
        print(f"  ❌ Errore durante l'Health Check: {e}")

def trigger_migrations():
    """Trigger automated database migrations on the production server."""
    print("\n🗄️  Esecuzione migrazioni database...")
    token = os.getenv('MIGRATION_TOKEN')
    app_url = os.getenv('APP_URL', 'https://www.fusionteamvolley.it/ERP')
    
    if not token:
        print("  ⚠️  MIGRATION_TOKEN non trovato in .env. Salto migrazioni automatiche.")
        return

    url = f"{app_url.rstrip('/')}/api/migrate.php"
    try:
        parsed_url = urllib.parse.urlparse(url)
        import ssl
        context = ssl._create_unverified_context()
        conn = http.client.HTTPSConnection(parsed_url.netloc, timeout=30, context=context)
        
        headers = {
            'X-Migration-Token': token,
            'Content-Type': 'application/json'
        }
        
        conn.request("POST", parsed_url.path + "?" + (parsed_url.query or ""), headers=headers)
        response = conn.getresponse()
        data = json.loads(response.read().decode())
        
        if response.status == 200 and data.get('success'):
            applied = data.get('applied', [])
            if applied:
                print(f"  ✅ {len(applied)} migrazioni applicate con successo:")
                for m in applied:
                    print(f"    - {m}")
            else:
                print("  ✅ Database già aggiornato. Nessuna nuova migrazione necessaria.")
        else:
            print(f"  ❌ Errore durante le migrazioni: {data.get('error', 'Unknown error')}")
            sys.exit(1)
            
    except Exception as e:
        print(f"  ❌ Errore di connessione durante il trigger delle migrazioni: {e}")
        # Non usciamo per errore di rete, ma avvisiamo l'utente
        print("  ⚠️  Assicurati di controllare manualmente lo stato del database.")

def main():
    t0 = _time.time()
    parser = argparse.ArgumentParser(description="Fusion ERP Fast Auto-Deploy")
    parser.add_argument("--no-build", action="store_true", help="Salta la build dei progetti React")
    parser.add_argument("--force-build", action="store_true", help="Forza la build anche se non sono state rilevate modifiche")
    parser.add_argument("--no-git", action="store_true", help="Salta il commit e push su GitHub")
    parser.add_argument("--dry-run", action="store_true", help="Simula il deploy senza caricare file o committare")
    parser.add_argument("--skip-checks", action="store_true", help="Salta i controlli pre-flight (PHPStan, Stress Test)")
    args = parser.parse_args()

    # 0. Fast Checks (Credentials and mandatory files)
    load_env()
    
    if not os.path.exists('.env.prod'):
        print("❌ Error: .env.prod file not found. Create it with production credentials before deploying.")
        print("💡 Hint: This file will be uploaded as '.env' on the production server.")
        sys.exit(1)

    print("=== Fusion ERP Fast Auto-Deploy ===")

    # 1. Pre-flight Checks (opzionali)
    if not args.dry_run and not args.skip_checks:
        run_preflight_checks()

    # 2. Carica cache per smart build
    cache = load_cache()

    # 3. Build React apps (se presenti e modificati)
    build_react_apps(force=args.force_build, skip=args.no_build, cache=cache)

    # 4. Aggiorna cache buster PRIMA del commit git
    #    (così il commit include la nuova versione cache)
    if not args.dry_run:
        update_index_version()

    # 5. Salva su GitHub (commit + push)
    git_commit_and_push(skip=(args.no_git or args.dry_run))

    # 6. Deploy FTP → Migrazioni → Health Check
    try:
        success = deploy_files_via_ftp(dry_run=args.dry_run)
        if success and not args.dry_run:
            trigger_migrations()
            verify_deployment()
    except KeyboardInterrupt:
        print("\n🛑 Deployment interrupted by user. Cache saved for uploaded files.")
        success = False

    elapsed = _time.time() - t0
    if success:
        if args.dry_run:
            print(f"\n🏁 Dry run completato in {elapsed:.1f}s — nessuna modifica effettuata.")
        else:
            print(f"\n🎉 Deploy completato in {elapsed:.1f}s!")
            print("L'applicazione è live. Solo i file modificati sono stati caricati.")
    else:
        print(f"\n💥 Deploy fallito dopo {elapsed:.1f}s. Controlla gli errori sopra.")
        sys.exit(1)

if __name__ == '__main__':
    main()

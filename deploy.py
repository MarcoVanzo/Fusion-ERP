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
from typing import Optional

# Timeouts (seconds)
GIT_TIMEOUT = 30
GIT_PUSH_TIMEOUT = 60
FTP_CONNECT_TIMEOUT = 30
FTP_OP_TIMEOUT = 30

CACHE_FILE = '.deploy_cache.json'
MAX_WORKERS = 8

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

def deploy_files_via_ftp():
    """Upload project files via FTP in parallel, only if changed."""
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
        
        ignore_dirs = ['.git', 'node_modules', 'tests', '__pycache__', '.pytest_cache', '.gemini', '.venv', 'venv_video', 'uploads']
        ignore_extensions = ['.zip', '.log']
        ignore_files = ['deploy.py', 'deploy.mp', 'deploy_ftp.sh', CACHE_FILE]

        upload_jobs: list[tuple[str, str, str, str]] = []
        required_dirs: set[str] = set()
        required_dirs.add(base_remote_dir)
        skip_count: int = 0

        print("🔍 Scanning for modified files...")
        for root, dirs, files in os.walk('.'):
            # Prune ignored directories in-place
            for d in list(dirs):
                if d in ignore_dirs:
                    dirs.remove(d)

            # Calculate the corresponding remote path
            rel_path = os.path.relpath(root, '.')
            
            # Map fusion-website/dist to the root folder in production
            if rel_path == 'fusion-website/dist' or rel_path.startswith('fusion-website/dist/'):
                sub_rel = rel_path.replace('fusion-website/dist', '').lstrip('/\\')
                remote_sub_dir = '/www.fusionteamvolley.it' if not sub_rel else f"/www.fusionteamvolley.it/{sub_rel}".replace('\\', '/')
            else:
                remote_sub_dir = base_remote_dir if rel_path == '.' else f"{base_remote_dir}/{rel_path}".replace('\\', '/')

            for file in files:
                # Skip ignored / hidden files (allow .htaccess and .env.prod)
                if file not in ('.htaccess', '.env.prod') and (
                    file in ignore_files
                    or file.startswith('.')
                    or any(file.endswith(ext) for ext in ignore_extensions)
                ):
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
            
        return True
        
    except Exception as e:
        print(f"❌ FTP Error: {e}")
        return False

def git_commit_and_push():
    """Committa tutte le modifiche locali e fa push su GitHub prima del deploy."""
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

        # Push sempre (anche se non c'era commit, può esserci roba non pushata)
        push_result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            capture_output=True, text=True,
            timeout=GIT_PUSH_TIMEOUT
        )
        if push_result.returncode == 0:
            print("  ✅ Push su GitHub completato.")
        else:
            print(f"  ⚠️  Push fallito (non bloccante): {push_result.stderr.strip()}")

    except subprocess.TimeoutExpired:
        print("  ⚠️  Git timeout — il push potrebbe richiedere credenziali. Continuo il deploy...")
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

def main():
    print("=== Fusion ERP Fast Auto-Deploy ===")
    
    # 1. Load credentials
    load_env()
    
    # 2. Aggiorna cache buster prima del deploy
    update_index_version()

    # 3. Salva su GitHub prima di deployare
    git_commit_and_push()

    # 4. Ensure .env.prod exists
    if not os.path.exists('.env.prod'):
        print("❌ Error: .env.prod file not found. Create it with production credentials before deploying.")
        sys.exit(1)

    # 5. Deploy directly
    try:
        success = deploy_files_via_ftp()
    except KeyboardInterrupt:
        print("\n🛑 Deployment interrupted by user. Cache saved for uploaded files.")
        success = False

    if success:
        print("\n🎉 Auto-deployment finished successfully!")
        print("Your application is now live. Only changed files were uploaded.")
    else:
        print("\n💥 Deployment failed. Please check the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()

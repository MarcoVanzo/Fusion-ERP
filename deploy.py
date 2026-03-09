#!/usr/bin/env python3
import os
import ftplib
import sys
import re
import hashlib
import json
import subprocess
import time as _time
from typing import cast

# ── Production DB credentials (used only during deploy, never committed) ──────
_PROD_DB = {
    'DB_HOST': '31.11.39.161',
    'DB_NAME': 'Sql1804377_2',
    'DB_USER': 'Sql1804377',
    'DB_PASS': 'u3z4t994$@psAPr',
    'DB_PORT': '3306',
}
# ── Local dev DB credentials (restored after deploy) ─────────────────────────
_LOCAL_DB = {
    'DB_HOST': '127.0.0.1',
    'DB_NAME': 'fusion_dev',
    'DB_USER': 'fusion',
    'DB_PASS': 'fusion123',
    'DB_PORT': '3306',
}

def _swap_env_db(target: dict) -> dict:
    """Rewrite .env with the given DB credentials. Returns the OLD values."""
    env_file = '.env'
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        old = {}
        new_lines = []
        for line in lines:
            stripped = line.strip()
            matched = False
            for key, val in target.items():
                if stripped.startswith(key + '=') or stripped.startswith(key + ' ='):
                    # Save old value
                    m = re.match(r'^([^=]+)=(.*)$', stripped)
                    if m:
                        old[key] = m.group(2).strip().strip("'\"")
                    new_lines.append(f'{key}={val}\n')
                    matched = True
                    break
            if not matched:
                new_lines.append(line)
        with open(env_file, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return old
    except Exception as e:
        print(f'⚠️  Could not swap .env DB credentials: {e}')
        return {}

CACHE_FILE = '.deploy_cache.json'

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

def deploy_files_via_ftp():
    """Upload project files individually via FTP, only if changed."""
    print("\n🚀 Starting Fast Smart Auto-Deploy...")
    
    host = os.getenv('FTP_HOST', '')
    user = os.getenv('FTP_USER', '')
    password = os.getenv('FTP_PASS', '')
    base_remote_dir = os.getenv('FTP_DIR', '/ERP')
    
    if not host or not user or not password:
        print("❌ Error: FTP_HOST, FTP_USER, or FTP_PASS not set in .env file.")
        print("Please configure them in your .env file to enable automatic deployment.")
        return False
        
    try:
        print(f"🔌 Connecting to {host}...")
        ftp = ftplib.FTP_TLS(host)
        ftp.login(user, password)
        ftp.prot_p() 
        print("✅ Connected securely.\n")
        
        # Load local cache
        file_cache: dict[str, str] = load_cache()
        new_cache: dict[str, str] = {}
        
        # Keep track of directories we've verified or created
        created_dirs = set()
        
        # Ensure base directory exists
        ftp.cwd('/')
        ensure_remote_dir(ftp, base_remote_dir, created_dirs)
        
        ignore_dirs = ['.git', 'node_modules', 'tests', '__pycache__', '.pytest_cache', '.gemini', '.venv', 'uploads']
        ignore_extensions = ['.zip', '.log']
        ignore_files = ['deploy.py', 'deploy.mp', 'deploy_ftp.sh', CACHE_FILE]

        def _do_upload(local_path: str, remote_file: str) -> None:
            """Upload a single file via the enclosing FTP connection."""
            with open(local_path, 'rb') as fbin:
                ftp.storbinary(f'STOR {remote_file}', fbin)

        upload_count: int = 0
        skip_count: int = 0

        for root, dirs, files in os.walk('.'):
            # Prune ignored directories in-place
            for d in list(dirs):
                if d in ignore_dirs:
                    dirs.remove(d)

            # Calculate the corresponding remote path
            rel_path = os.path.relpath(root, '.')
            
            # Map fusion-website/dist to the /demo folder in production
            if rel_path == 'fusion-website/dist' or rel_path.startswith('fusion-website/dist/'):
                sub_rel = rel_path.replace('fusion-website/dist', '').lstrip('/\\')
                remote_sub_dir = '/www.fusionteamvolley.it/demo' if not sub_rel else f"/www.fusionteamvolley.it/demo/{sub_rel}".replace('\\', '/')
            else:
                remote_sub_dir = base_remote_dir if rel_path == '.' else f"{base_remote_dir}/{rel_path}".replace('\\', '/')

            # Lazy-CD: only change remote dir when we actually need to upload something
            dir_prepared: bool = False
            current_remote_dir: str = remote_sub_dir

            for file in files:
                # Skip ignored / hidden files (allow .htaccess)
                if file != '.htaccess' and (
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

                new_cache[local_file_path] = file_hash

                # Skip if unchanged
                cached_hash: str = file_cache.get(local_file_path, '')
                if cached_hash and cached_hash == file_hash:
                    skip_count += 1
                    continue

                # Ensure remote directory exists before first upload in this dir
                if not dir_prepared:
                    ftp.cwd('/')
                    ensure_remote_dir(ftp, current_remote_dir, created_dirs)
                    ftp.cwd(current_remote_dir)
                    dir_prepared = True

                print(f"  ⬆️ Uploading {rel_path}/{file} ...")
                _do_upload(local_file_path, file)
                upload_count = cast(int, upload_count) + 1

                # Incrementally persist cache to survive interruptions
                if upload_count % 50 == 0:
                    save_cache(new_cache)

        # Save the new cache so the next run skips all unchanged files
        save_cache(new_cache)
                
        print(f"\n✅ Upload complete! Successfully transferred {upload_count} modified files (skipped {skip_count} unchanged files).")
        ftp.quit()
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
            capture_output=True, text=True, check=True
        )
        if not result.stdout.strip():
            print("  ℹ️  Nessuna modifica locale da committare.")
        else:
            timestamp = _time.strftime('%Y-%m-%d %H:%M')
            subprocess.run(['git', 'add', '-A'], check=True)
            subprocess.run(
                ['git', 'commit', '-m', f'deploy: {timestamp}'],
                check=True
            )
            print(f"  ✅ Commit creato: deploy: {timestamp}")

        # Push sempre (anche se non c'era commit, può esserci roba non pushata)
        push_result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            capture_output=True, text=True
        )
        if push_result.returncode == 0:
            print("  ✅ Push su GitHub completato.")
        else:
            print(f"  ⚠️  Push fallito (non bloccante): {push_result.stderr.strip()}")

    except subprocess.CalledProcessError as e:
        print(f"  ⚠️  Git error (non bloccante): {e}")
    print()


def update_index_version():
    """Aggiorna il parametro ?v=... in index.html per forzare il refresh della cache (CSS, JS) in produzione."""
    import time
    version = str(int(time.time()))
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
    
    # 2. Salva su GitHub prima di deployare
    git_commit_and_push()

    # 3. Aggiorna cache buster prima del deploy
    update_index_version()

    # 4. Swap .env to production DB before upload
    print("🔄 Switching .env to production DB...")
    _swap_env_db(_PROD_DB)

    # 5. Deploy directly
    try:
        success = deploy_files_via_ftp()
    except KeyboardInterrupt:
        print("\n🛑 Deployment interrupted by user. Cache saved for uploaded files.")
        success = False
    finally:
        # 6. Always restore local .env after deploy
        print("🔄 Restoring .env to local dev DB...")
        _swap_env_db(_LOCAL_DB)

    if success:
        print("\n🎉 Auto-deployment finished successfully!")
        print("Your application is now live. Only changed files were uploaded.")
    else:
        print("\n💥 Deployment failed. Please check the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()

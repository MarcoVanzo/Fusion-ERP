#!/usr/bin/env python3
import os
import ftplib
import sys
import re
import hashlib
import json

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
    """Calculate MD5 hash of a file."""
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()
    except Exception as e:
        print(f"⚠️ Error hashing {filepath}: {e}")
        return None

def load_cache():
    """Load the file hash cache."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
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
        file_cache = load_cache()
        new_cache = {}
        
        # Keep track of directories we've verified or created
        created_dirs = set()
        
        # Ensure base directory exists
        ftp.cwd('/')
        ensure_remote_dir(ftp, base_remote_dir, created_dirs)
        
        ignore_dirs = ['.git', 'node_modules', 'tests', '__pycache__', '.pytest_cache', '.gemini', '.venv']
        ignore_extensions = ['.zip', '.log']
        ignore_files = ['deploy.py', 'deploy.mp', 'deploy_ftp.sh', CACHE_FILE]
        
        upload_count = 0
        skip_count = 0
        
        for root, dirs, files in os.walk('.'):
            # Prune ignored directories
            for d in list(dirs):
                if d in ignore_dirs or d.startswith('.'):
                    # We might skip all hidden dirs here, or specifically those in ignore_dirs.
                    # Exclude .git etc via ignore_dirs. 
                    if d in ignore_dirs:
                        dirs.remove(d)
            
            # Calculate the corresponding remote path
            rel_path = os.path.relpath(root, '.')
            remote_sub_dir = base_remote_dir if rel_path == '.' else f"{base_remote_dir}/{rel_path}".replace('\\', '/')
            
            # Prepare to CD if we have files to upload in this dir (lazy cd)
            dir_prepared = False
            
            current_remote_dir = remote_sub_dir
            
            for file in files:
                if file in ignore_files or any(file.endswith(ext) for ext in ignore_extensions) or file.startswith('.'):
                    if file != '.htaccess' and file != '.env': # Allow .htaccess and .env
                        skip_count += 1
                        continue
                    
                local_file_path = os.path.join(root, file)
                
                # Check hash
                file_hash = get_file_hash(local_file_path)
                if not file_hash:
                    continue
                
                new_cache[local_file_path] = file_hash
                
                # If hash hasn't changed, skip upload
                if local_file_path in file_cache and file_cache[local_file_path] == file_hash:
                    skip_count += 1
                    continue
                
                # We need to upload. Ensure directory is ready if not done yet
                if not dir_prepared:
                    ftp.cwd('/')
                    ensure_remote_dir(ftp, current_remote_dir, created_dirs)
                    ftp.cwd(current_remote_dir)
                    dir_prepared = True
                
                print(f"  ⬆️ Uploading {rel_path}/{file} ...")
                with open(local_file_path, 'rb') as f:
                    ftp.storbinary(f'STOR {file}', f)
                upload_count += 1
                
                # Incrementally save cache to prevent total loss on interrupt
                if upload_count % 50 == 0:
                    save_cache(new_cache)
                
        # Save the new cache so exact next run skips all
        save_cache(new_cache)
                
        print(f"\n✅ Upload complete! Successfully transferred {upload_count} modified files (skipped {skip_count} unchanged files).")
        ftp.quit()
        return True
        
    except Exception as e:
        print(f"❌ FTP Error: {e}")
        return False

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
    
    # 3. Deploy directly
    try:
        success = deploy_files_via_ftp()
        if success:
            print("\n🎉 Auto-deployment finished successfully!")
            print("Your application is now live. Only changed files were uploaded.")
        else:
            print("\n💥 Deployment failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Deployment interrupted by user. Cache saved for uploaded files.")
        sys.exit(1)

if __name__ == '__main__':
    main()

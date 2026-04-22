import os
import ftplib
import re

def load_env():
    env_file = '.env'
    if not os.path.exists(env_file):
        return
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            match = re.match(r'^([^=]+)=(.*)$', line)
            if match:
                os.environ[match.group(1).strip()] = match.group(2).strip().strip("'\"")

load_env()
host = os.environ.get('FTP_HOST')
user = os.environ.get('FTP_USER')
password = os.environ.get('FTP_PASS')
base_dir = os.environ.get('FTP_DIR', '/ERP')

try:
    print(f"Connecting to {host}...")
    ftp = ftplib.FTP_TLS(host, timeout=30)
    ftp.login(user, password)
    ftp.prot_p()
    ftp.set_pasv(True)
    
    remote_path = f"{base_dir}/db/migrations"
    print(f"Directory: {remote_path}")
    ftp.cwd(remote_path)
    
    files = ftp.nlst()
    print("Files found in migrations:")
    found_v013b = False
    
    for f in files:
        if 'V013b' in f:
            print(f"Deleting duplicate migration: {f}")
            ftp.delete(f)
            found_v013b = True
            
    if not found_v013b:
        print("V013b not found on server.")
        
    ftp.quit()
    print("Cleanup successful.")
except Exception as e:
    print(f"Error: {e}")

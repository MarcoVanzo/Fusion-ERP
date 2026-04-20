import os
import ftplib

def load_env(filepath):
    env = {}
    with open(filepath) as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                env[k] = v.strip('"\'')
    return env

env = load_env('.env.prod')
host = env.get('FTP_HOST')
user = env.get('FTP_USER')
password = env.get('FTP_PASS')
cwd = env.get('FTP_DIR', '/ERP')

if not host:
    print('No FTP_HOST in .env.prod')
    exit(1)

print(f"Connecting to {host}...")
try:
    ftp = ftplib.FTP(host)
    if user:
        ftp.login(user, password)
    else:
        ftp.login()
        
    ftp.cwd(cwd)
    
    print("Listing files...")
    files = ftp.nlst()
    
    for f in ['ai_debug.log', 'local_debug_error.log', 'api/error_log', 'error_log']:
        try:
            print(f"\n--- Downloading {f} ---")
            content = []
            
            def handle_binary(more_data):
                content.append(more_data.decode('utf-8', errors='replace'))
                
            ftp.retrbinary(f"RETR {f}", handle_binary)
            text = "".join(content)
            lines = text.split('\n')
            for line in lines[-20:]:  # Print last 20 lines
                print(line)
        except Exception as e:
            print(f"Could not download {f}: {e}")
            
    ftp.quit()
except Exception as e:
    print(f"FTP Error: {e}")

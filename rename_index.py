import os
import ftplib
import re

def load_env():
    env_file = '.env'
    if not os.path.exists(env_file):
        return False
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            match = re.match(r'^([^=]+)=(.*)$', line)
            if match:
                key, val = match.groups()
                os.environ[key.strip()] = val.strip().strip("'\"")
    return True

load_env()
host = os.getenv('FTP_HOST', '')
user = os.getenv('FTP_USER', '')
password = os.getenv('FTP_PASS', '')

print("Connecting to FTP...")
ftp = ftplib.FTP_TLS(host)
ftp.login(user, password)
ftp.prot_p()
ftp.set_pasv(True)

ftp.cwd('/www.fusionteamvolley.it')
print("Current files:")
files = ftp.nlst()
print(files)

if 'index.php' in files:
    print("Renaming index.php to index.php.bak...")
    ftp.rename('index.php', 'index.php.bak')
    print("Done!")
else:
    print("index.php not found.")

ftp.quit()

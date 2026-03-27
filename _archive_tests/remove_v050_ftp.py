import os
import ftplib

import typing

env = {}
try:
    with open('.env') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip("'\"")
except FileNotFoundError:
    pass

host = typing.cast(str, env.get('FTP_HOST') or os.getenv('FTP_HOST'))
user = typing.cast(str, env.get('FTP_USER') or os.getenv('FTP_USER'))
password = typing.cast(str, env.get('FTP_PASS') or os.getenv('FTP_PASS'))
base_dir = typing.cast(str, env.get('FTP_DIR') or os.getenv('FTP_DIR') or '/ERP')

try:
    if not host or not user or not password:
        raise ValueError("Missing FTP credentials")
    
    ftp = ftplib.FTP_TLS(host)
    ftp.login(user, password)
    ftp.prot_p()
    ftp.cwd(base_dir)
    ftp.delete('run_v050.php')
    ftp.quit()
    print("run_v050.php removed successfully")
except Exception as e:
    print(f"Error removing file via FTP: {e}")

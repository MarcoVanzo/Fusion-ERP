import ftplib
import os

env = {}
with open('.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip("'\"")

import typing

ftp_host = typing.cast(str, env.get('FTP_HOST'))
ftp_user = typing.cast(str, env.get('FTP_USER'))
ftp_pass = typing.cast(str, env.get('FTP_PASS'))

if not ftp_host or not ftp_user or not ftp_pass:
    raise ValueError("Missing FTP credentials in .env")

ftp = ftplib.FTP(ftp_host)
ftp.login(ftp_user, ftp_pass)
ftp.cwd('/www.fusionteamvolley.it/ERP')

with open('test_prod_sync3.php', 'rb') as f:
    ftp.storbinary('STOR test_prod_sync3.php', f)

print("Uploaded test_prod_sync.php directly.")
ftp.quit()

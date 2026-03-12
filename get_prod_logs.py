import os
import ftplib
import urllib.parse
from dotenv import load_dotenv

for file in ['.env', 'prod_env.txt']:
    if os.path.exists(file):
        load_dotenv(file)

ftp_host = str(os.getenv('FTP_HOST', 'ftp.fusionteamvolley.it')).replace('ftps://', '')
ftp_user = os.getenv('FTP_USER')
ftp_pass = os.getenv('FTP_PASS')
ftp_pass = urllib.parse.unquote(ftp_pass) if ftp_pass else None

ftp = ftplib.FTP_TLS(ftp_host)
ftp.login(ftp_user, ftp_pass)
ftp.prot_p()

try:
    ftp.cwd('www.fusionteamvolley.it/ERP')
    with open('prod_error.log', 'wb') as f:
        ftp.retrbinary('RETR local_debug_error.log', f.write)
    print("Log downloaded to prod_error.log")
except Exception as e:
    print("Error:", e)

ftp.quit()

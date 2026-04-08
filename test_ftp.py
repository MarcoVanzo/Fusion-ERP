import ftplib
import os

host = os.getenv('FTP_HOST', '')
user = os.getenv('FTP_USER', '')
password = os.getenv('FTP_PASS', '')

ftp = ftplib.FTP_TLS(host)
ftp.login(user, password)
ftp.prot_p()
ftp.set_pasv(True)
ftp.cwd('/www.fusionteamvolley.it/ERP/db/migrations')
ftp.retrlines('LIST')
ftp.quit()

import os, ftplib
from dotenv import load_dotenv

load_dotenv()
host = os.getenv('FTP_HOST')
user = os.getenv('FTP_USER')
password = os.getenv('FTP_PASS')
base = os.getenv('FTP_DIR')

ftp = ftplib.FTP_TLS(host)
ftp.login(user, password)
ftp.prot_p()
ftp.set_pasv(True)
ftp.cwd(base + '/vendor')

lines = []
ftp.dir(lines.append)
print("\n".join(lines))
ftp.quit()

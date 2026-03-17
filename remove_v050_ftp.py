import os
import ftplib

from dotenv import load_dotenv
load_dotenv('.env')

host = os.getenv('FTP_HOST')
user = os.getenv('FTP_USER')
password = os.getenv('FTP_PASS')
base_dir = os.getenv('FTP_DIR', '/ERP')

try:
    ftp = ftplib.FTP_TLS(host)
    ftp.login(user, password)
    ftp.prot_p()
    ftp.cwd(base_dir)
    ftp.delete('run_v050.php')
    ftp.quit()
    print("run_v050.php removed successfully")
except Exception as e:
    print(f"Error removing file via FTP: {e}")

import ftplib, os, dotenv
dotenv.load_dotenv('.env')
host = os.getenv('FTP_HOST')
user = os.getenv('FTP_USER')
password = os.getenv('FTP_PASS')
ftp = ftplib.FTP_TLS(host)
ftp.login(user, password)
ftp.prot_p()
target_dir = '/ERP/assets/anatomy'
try:
    ftp.mkd(target_dir)
except:
    pass
for img in ['female_muscle_front.png', 'female_muscle_back.png']:
    path = f"assets/anatomy/{img}"
    print(f"Uploading {path}...")
    with open(path, 'rb') as f:
        ftp.storbinary(f"STOR {target_dir}/{img}", f)
ftp.quit()
print("Done!")

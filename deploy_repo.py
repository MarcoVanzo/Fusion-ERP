import os, ftplib
def load_env():
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k,v = line.strip().split('=', 1)
                os.environ[k.strip()] = v.strip().strip("'\"")

load_env()
ftp = ftplib.FTP_TLS(os.environ['FTP_HOST'])
ftp.login(os.environ['FTP_USER'], os.environ['FTP_PASS'])
ftp.prot_p()

base1 = os.environ['FTP_DIR'] + '/api/Modules/Social'
try:
    ftp.cwd(base1)
    with open('api/Modules/Social/SocialRepository.php', 'rb') as f:
        ftp.storbinary('STOR SocialRepository.php', f)
    print("Uploaded to Modules")
except Exception as e: print(e)

base2 = os.environ['FTP_DIR'] + '/api/modules/Social'
try:
    ftp.cwd(base2)
    with open('api/Modules/Social/SocialRepository.php', 'rb') as f:
        ftp.storbinary('STOR SocialRepository.php', f)
    print("Uploaded to modules")
except Exception as e: print(e)

ftp.quit()

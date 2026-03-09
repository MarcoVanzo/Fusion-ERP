import sys, os, ftplib
def load_env():
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k,v = line.strip().split('=', 1)
                os.environ[k.strip()] = v.strip().strip("'\"")

files_to_deploy = sys.argv[1:]
if not files_to_deploy:
    print("Please specify files to deploy")
    sys.exit(1)

load_env()
ftp = ftplib.FTP_TLS(os.environ['FTP_HOST'])
ftp.login(os.environ['FTP_USER'], os.environ['FTP_PASS'])
ftp.prot_p()

for file_path in files_to_deploy:
    upload_dir = os.path.dirname(file_path)
    curr_dir = os.environ['FTP_DIR']
    if upload_dir and upload_dir != '.':
        curr_dir += '/' + upload_dir

    try:
        ftp.cwd(curr_dir)
    except Exception as e:
        print(e)
        pass 

    file_name = os.path.basename(file_path)
    with open(file_path, 'rb') as f:
        ftp.storbinary('STOR ' + file_name, f)
        print("Uploaded " + file_name)
    ftp.cwd('/')
ftp.quit()
print("Successo")

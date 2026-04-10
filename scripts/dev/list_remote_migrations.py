
import ftplib
import os

host = 'ftp.fusionteamvolley.it'
user = '12639683@aruba.it'
password = 'pJd1L3kPXaICJ!'
remote_dir = '/www.fusionteamvolley.it/ERP/db/migrations'

try:
    ftp = ftplib.FTP(host)
    ftp.login(user, password)
    print(f"Connected to {host}")
    
    files = ftp.nlst(remote_dir)
    print(f"Found {len(files)} migration files on server.")
    
    # Sort and print the last 5
    files.sort()
    for f in files[-5:]:
        print(f"  - {f}")
        
    ftp.quit()
except Exception as e:
    print(f"Error: {e}")

import os
import ftplib
import sys

host = 'ftp.fusionteamvolley.it'
user = '12639683@aruba.it'
password = 'pJd1L3kPXaICJ!'
base_remote_dir = '/www.fusionteamvolley.it/demo'
local_dir = 'dist'

def ensure_remote_dir(ftp, remote_dir, created_dirs):
    if remote_dir in created_dirs:
        return True
    try:
        ftp.cwd(remote_dir)
        ftp.cwd('/') # return space
        created_dirs.add(remote_dir)
        return True
    except ftplib.error_perm:
        try:
            parent = os.path.dirname(remote_dir)
            if parent and parent != '/' and parent != remote_dir:
                ensure_remote_dir(ftp, parent, created_dirs)
            ftp.mkd(remote_dir)
            created_dirs.add(remote_dir)
            return True
        except Exception as e:
            print(f"Directory creation failed for {remote_dir}: {e}")
            return False

def deploy():
    print(f"Connecting to {host}...")
    try:
        ftp = ftplib.FTP_TLS(host)
        ftp.login(user, password)
        ftp.prot_p()
        print("Connected.")
        
        created_dirs = set()
        ftp.cwd('/')
        ensure_remote_dir(ftp, base_remote_dir, created_dirs)
        
        for root, dirs, files in os.walk(local_dir):
            rel_path = os.path.relpath(root, local_dir)
            remote_sub_dir = base_remote_dir if rel_path == '.' else f"{base_remote_dir}/{rel_path}".replace('\\', '/')
            
            ftp.cwd('/')
            ensure_remote_dir(ftp, remote_sub_dir, created_dirs)
            ftp.cwd(remote_sub_dir)
            
            for f in files:
                local_f = os.path.join(root, f)
                print(f"Uploading {local_f} to {remote_sub_dir}/{f}")
                with open(local_f, 'rb') as fbin:
                    ftp.storbinary(f'STOR {f}', fbin)
                    
        print("Deploy complete!")
        ftp.quit()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    deploy()

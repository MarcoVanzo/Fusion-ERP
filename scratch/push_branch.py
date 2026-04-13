import os
import subprocess

def get_token():
    with open('.env.prod', 'r') as f:
        for line in f:
            if line.startswith('GITHUB_TOKEN='):
                return line.strip().split('=')[1].strip('"').strip("'")
    return None

token = get_token()
repo = "MarcoVanzo/Fusion-ERP"
cmd = f"git push https://x-access-token:{token}@github.com/{repo}.git fix-phpunit-casing"
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)

import os
import re
import json

report = {
    'db_mismatches': [],
    'routing_errors': [],
    'auth_errors': [],
    'tenant_errors': [],
    'js_errors': [],
    'env_errors': []
}

def analyze_db():
    tables = {}
    db_paths = [os.path.join('db/migrations', f) for f in os.listdir('db/migrations') if f.endswith('.sql')]
    db_paths.sort()
    
    # Very basic static parse for tables created or altered
    for p in db_paths:
        with open(p, 'r') as f:
            content = f.read()
            # Find CREATE TABLE
            for match in re.finditer(r'CREATE TABLE(?:\s+IF NOT EXISTS)?\s+([a-zA-Z0-9_]+)\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE):
                t_name = match.group(1).lower()
                cols = re.findall(r'^\s*([a-zA-Z0-9_]+)\s+[A-Z]+', match.group(2), re.MULTILINE)
                tables[t_name] = set([c.lower() for c in cols])
                
            # Find ALTER TABLE ADD
            for match in re.finditer(r'ALTER TABLE\s+([a-zA-Z0-9_]+)\s+ADD(?:\s+COLUMN)?\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE):
                t_name = match.group(1).lower()
                col = match.group(2).lower()
                if t_name not in tables:
                    tables[t_name] = set()
                tables[t_name].add(col)
                
            # Find ALTER TABLE DROP
            for match in re.finditer(r'ALTER TABLE\s+([a-zA-Z0-9_]+)\s+DROP(?:\s+COLUMN)?\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE):
                t_name = match.group(1).lower()
                col = match.group(2).lower()
                if t_name in tables and col in tables[t_name]:
                    tables[t_name].remove(col)
                    
            # Find DROP TABLE
            for match in re.finditer(r'DROP TABLE\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE):
                t_name = match.group(1).lower()
                if t_name in tables:
                    del tables[t_name]

    # Now verify Repositories
    repos = []
    for root, dirs, files in os.walk('api/Modules'):
        for file in files:
            if file.endswith('Repository.php'):
                repos.append(os.path.join(root, file))
                
    for repo in repos:
        with open(repo, 'r') as f:
            content = f.read()
            # find basic field accesses like "users.email" or "UPDATE users SET field=..."
            # This is hard to do perfectly, but let's try finding INSERT INTO tables and the columns
            for match in re.finditer(r'INSERT INTO\s+([a-zA-Z0-9_]+)\s*\((.*?)\)', content, re.IGNORECASE | re.DOTALL):
                t_name = match.group(1).lower()
                cols = [c.strip().lower() for c in match.group(2).split(',')]
                if t_name in tables:
                    for col in cols:
                        if col not in tables[t_name] and col != '':
                            report['db_mismatches'].append(f"{repo} references missing col {col} in {t_name}")
            
            # Simple select checks (optional, hard to parse accurately)

def analyze_controllers():
    router_path = 'api/router.php'
    router_content = open(router_path).read() if os.path.exists(router_path) else ''
    mapped_actions = re.findall(r"['\"]action['\"]\s*=>\s*['\"]([a-zA-Z0-9_]+)['\"]", router_content)
    
    for root, dirs, files in os.walk('api/Modules'):
        for file in files:
            if file.endswith('Controller.php'):
                ctrl_path = os.path.join(root, file)
                mod_name = os.path.basename(root)
                with open(ctrl_path, 'r') as f:
                    content = f.read()
                    
                    methods = re.findall(r'public\s+function\s+([a-zA-Z0-9_]+)', content)
                    for m in methods:
                        if m == '__construct': continue
                        if m not in mapped_actions:
                            report['routing_errors'].append(f"Action {mod_name}::{m} not found in router")
                            
                        # Extract method body roughly
                        match = re.search(r'function\s+' + m + r'\s*\([^)]*\)\s*{(.*?)(?:public\s+function|$)', content, re.DOTALL)
                        if match:
                            body = match.group(1)
                            is_write = re.search(r'(create|update|delete|save|insert|add|remove|edit)', m, re.IGNORECASE)
                            if is_write:
                                if not re.search(r'Auth::require[a-zA-Z]+\(', body) and not re.search(r'\$this->require[a-zA-Z]+\(', body):
                                    report['auth_errors'].append(f"{mod_name}::{m} missing Auth::require*")
                                if not re.search(r'(TenantContext::getTenantId|tenant_id|repository->[a-zA-Z]+)', body):
                                    report['tenant_errors'].append(f"{mod_name}::{m} might be missing tenant logic")

def analyze_js():
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or 'vendor' in root: continue
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if re.search(r'(TODO|FIXME|placeholder|YOUR_)', line, re.IGNORECASE):
                                report['js_errors'].append(f"{path}:{i+1} - {line.strip()}")
                except UnicodeDecodeError:
                    pass

def analyze_env():
    env = {}
    env_prod = {}
    if os.path.exists('.env'):
        for line in open('.env'):
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env[k] = v
    if os.path.exists('.env.prod'):
        for line in open('.env.prod'):
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_prod[k] = v
                
    for k, v in env.items():
        if k not in env_prod:
            report['env_errors'].append(f"Missing in .env.prod: {k}")
        elif env[k] == env_prod[k] and k in ['APP_ENV', 'APP_DEBUG', 'DB_HOST', 'STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY']:
            report['env_errors'].append(f"Identical value between dev/prod for {k}: {v}")
            
    for k, v in env_prod.items():
        if 'YOUR_' in v or 'PLACEHOLDER' in v:
            report['env_errors'].append(f"Placeholder in .env.prod: {k}={v}")

if __name__ == '__main__':
    analyze_db()
    analyze_controllers()
    analyze_js()
    analyze_env()
    print(json.dumps(report, indent=2))

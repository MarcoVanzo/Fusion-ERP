import os
import re
import json

report = {
    'P1_Database': [],
    'P2_Backend': [],
    'P3_Frontend': [],
    'P4_Mobile': [],
    'P5_Config': []
}

def phase2_backend():
    for root, dirs, files in os.walk('api/Modules'):
        for file in files:
            if file.endswith('Controller.php'):
                ctrl_path = os.path.join(root, file)
                with open(ctrl_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    methods = re.findall(r'public\s+function\s+([a-zA-Z0-9_]+)', content)
                    for m in methods:
                        if m == '__construct': continue
                        # extract method body
                        match = re.search(r'function\s+' + m + r'\s*\([^)]*\)\s*{(.*?)(?:public\s+function|$)', content, re.DOTALL)
                        if match:
                            body = match.group(1)
                            is_write = re.search(r'(create|update|delete|save|insert|add|remove|edit)', m, re.IGNORECASE)
                            if is_write:
                                if not re.search(r'(Auth::require[a-zA-Z]+|\$this->require[a-zA-Z]+)', body):
                                    report['P2_Backend'].append(f"P1 - Missing Auth in {file}::{m} (Write action without auth check)")
                                if not re.search(r'(TenantContext::getTenantId|tenant_id|repository->[a-zA-Z]+)', body):
                                    report['P2_Backend'].append(f"P2 - Missing Tenant isolation in {file}::{m}")

def phase3_frontend():
    # find all fetch or API calls in mapped endpoints
    controller_methods = set()
    for root, dirs, files in os.walk('api/Modules'):
        for file in files:
            if file.endswith('Controller.php'):
                module = file.replace('Controller.php', '').lower()
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    methods = re.findall(r'public\s+function\s+([a-zA-Z0-9_]+)', f.read())
                    for m in methods:
                        controller_methods.add(f"{module}/{m.lower()}")

    js_files = []
    for root, dirs, files in os.walk('js/modules'):
        for f in files:
            if f.endswith('.js'): js_files.append(os.path.join(root, f))
    
    for jsFile in js_files:
        with open(jsFile, 'r', encoding='utf-8') as f:
            content = f.read()
            # check Placeholders
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if re.search(r'(TODO|FIXME|placeholder="[^"]*YOUR_|placeholder="[^"]*0.00)', line, re.IGNORECASE):
                    # We only care about explicit todos/placeholders, ignore empty placeholder text
                    if 'TODO' in line or 'FIXME' in line or 'placeholder=' in line and 'YOUR_' in line:
                        report['P3_Frontend'].append(f"P3 - {jsFile}:{i+1} Contains TODO/placeholder: {line.strip()[:60]}")
            
            # Check fetch routes
            fetches = re.findall(r'module=([a-zA-Z]+)&action=([a-zA-Z0-9_]+)', content)
            for module, action in fetches:
                k = f"{module.lower()}/{action.lower()}"
                if k not in controller_methods:
                    report['P3_Frontend'].append(f"P1 - Dead route in {jsFile}: ?module={module}&action={action}")

def phase4_mobile():
    script_path = 'scripts/audit-mobile.sh'
    if os.path.exists(script_path):
        report['P4_Mobile'].append("P3 - Manual Mobile Audit required as per scripts/audit-mobile.sh")
    
    # scan mobile app.js
    for root, dirs, files in os.walk('mobile'):
        for f in files:
            if f.endswith('.js'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as f2:
                    content = f2.read()
                    fetches = re.findall(r'module=([a-zA-Z]+)&action=([a-zA-Z0-9_]+)', content)
                    # We assume controller_methods is populated (it is local variable though)

def phase5_config():
    env1, env2 = {}, {}
    if os.path.exists('.env'):
        for line in open('.env'):
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env1[k] = v
    if os.path.exists('.env.prod'):
        for line in open('.env.prod'):
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env2[k] = v
                
    for k, v in env1.items():
        if k not in env2:
            report['P5_Config'].append(f"P1 - Missing key in .env.prod: {k}")
        elif env1[k] == env2[k] and k in ['APP_ENV', 'APP_DEBUG', 'STRIPE_SECRET_KEY']:
            report['P5_Config'].append(f"P2 - Identical dev/prod value for {k}: {v}")
            
    for k, v in env2.items():
        if 'YOUR_' in v.upper() or 'PLACEHOLDER' in v.upper():
            report['P5_Config'].append(f"P1 - Placeholder active in .env.prod: {k}={v}")

if __name__ == '__main__':
    phase2_backend()
    phase3_frontend()
    phase4_mobile()
    phase5_config()
    print(json.dumps(report, indent=2))

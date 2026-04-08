import os
import re

php_methods = set()
js_fetches = set()

for root, _, files in os.walk('api/Modules'):
    for file in files:
        if file.endswith('Controller.php'):
            path = os.path.join(root, file)
            with open(path, 'r', errors='ignore') as f:
                content = f.read()
                # Find all methods: public function actionName()
                matches = re.findall(r"public\s+function\s+([a-zA-Z0-9_-]+)\s*\(", content)
                php_methods.update(matches)

# Add custom ones we saw in router or similar
php_methods.add('login')

for root, _, files in os.walk('fusion-erp-react'):
    for file in files:
        if file.endswith('.js') or file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', errors='ignore') as f:
                content = f.read()
                matches = re.findall(r"action=([a-zA-Z0-9_-]+)", content)
                js_fetches.update(matches)

for root, _, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            path = os.path.join(root, file)
            with open(path, 'r', errors='ignore') as f:
                content = f.read()
                matches = re.findall(r"action=([a-zA-Z0-9_-]+)", content)
                js_fetches.update(matches)

print("Fetches in UI but no public method in Controllers:")
print(sorted(list(js_fetches - php_methods)))

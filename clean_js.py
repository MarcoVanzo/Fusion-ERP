import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Prefix catch exceptions with underscore
    content = re.sub(r'catch\s*\(\s*(e|err|error)\s*\)', r'catch (_\1)', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))
print("Done patching catch blocks.")

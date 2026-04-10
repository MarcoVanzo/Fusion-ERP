import os
import re

migrations_dir = 'db/migrations'
tables = {}

for filename in sorted(os.listdir(migrations_dir)):
    if not filename.endswith('.sql'): continue
    with open(os.path.join(migrations_dir, filename), 'r') as f:
        content = f.read()

    create_table_pattern = re.compile(r'CREATE TABLE \s*(?:IF NOT EXISTS\s+)?[`\'"]?([a-zA-Z0-9_]+)[`\'"]?\s*\((.*?)\)\s*(?:ENGINE|;)', re.IGNORECASE | re.DOTALL)
    for match in create_table_pattern.finditer(content):
        table_name = match.group(1).lower()
        body = match.group(2)
        columns = []
        for line in body.split(','):
            line = line.strip()
            if not line or line.upper().startswith(('PRIMARY', 'FOREIGN', 'UNIQUE', 'KEY', 'CONSTRAINT')):
                continue
            col_match = re.match(r'^[`\'"]?([a-zA-Z0-9_]+)[`\'"]?\s+([a-zA-Z0-9_]+)', line)
            if col_match:
                columns.append(col_match.group(1).lower())
        tables[table_name] = columns

    alter_table_pattern = re.compile(r'ALTER TABLE\s+[`\'"]?([a-zA-Z0-9_]+)[`\'"]?\s+ADD\s+(?:COLUMN\s+)?[`\'"]?([a-zA-Z0-9_]+)[`\'"]?', re.IGNORECASE)
    for match in alter_table_pattern.finditer(content):
        table_name = match.group(1).lower()
        col_name = match.group(2).lower()
        if table_name in tables:
            tables[table_name].append(col_name)

discrepancies = []

for root, _, files in os.walk('api/Modules'):
    for file in files:
        if file.endswith('.php'):
            path = os.path.join(root, file)
            with open(path, 'r', errors='ignore') as f:
                content = f.read().replace('\n', ' ').replace('\r', ' ')
                # Match INSERT INTO table_name (c1, c2)
                inserts = re.findall(r'INSERT INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)', content, re.IGNORECASE)
                for tname, cols in inserts:
                    tname = tname.lower()
                    if tname == 'migrations': continue
                    col_names = [c.strip().strip('`').lower() for c in cols.split(',')]
                    known_cols = tables.get(tname, [])
                    if not known_cols:
                        discrepancies.append(f"{path}: Table {tname} not found in DB schema")
                        continue
                    
                    for c in col_names:
                        if c not in known_cols:
                            discrepancies.append(f"{path}: Column {c} not in table {tname}")

print("Discrepancies found:", len(discrepancies))
for d in discrepancies:
    print("-", d)

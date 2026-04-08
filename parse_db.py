import os
import re

migrations_dir = 'db/migrations'
tables = {}

for filename in sorted(os.listdir(migrations_dir)):
    if not filename.endswith('.sql'): continue
    with open(os.path.join(migrations_dir, filename), 'r') as f:
        content = f.read()

    # Find CREATE TABLE statements
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

    # Find ALTER TABLE statements (add column)
    alter_table_pattern = re.compile(r'ALTER TABLE\s+[`\'"]?([a-zA-Z0-9_]+)[`\'"]?\s+ADD\s+(?:COLUMN\s+)?[`\'"]?([a-zA-Z0-9_]+)[`\'"]?', re.IGNORECASE)
    for match in alter_table_pattern.finditer(content):
        table_name = match.group(1).lower()
        col_name = match.group(2).lower()
        if table_name in tables:
            tables[table_name].append(col_name)

print("Tables found:", len(tables))
print(tables)

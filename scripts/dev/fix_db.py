import sqlite3
import subprocess
import re

db_path = "fusion_erp.db"

def run_checker():
    result = subprocess.run(["python3", "sql_checker.py"], capture_output=True, text=True)
    return result.stdout.split('\n')

def fix_discrepancies():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    has_changes = True
    iterations = 0
    
    while has_changes and iterations < 10:
        has_changes = False
        iterations += 1
        print(f"--- Iteration {iterations} ---")
        
        lines = run_checker()
        for line in lines:
            # Handle standard missing column
            if "Column " in line and "not in table " in line:
                m = re.search(r"Column (\S+) not in table (\S+)", line)
                if m:
                    col = m.group(1)
                    table = m.group(2)
                    try:
                        c.execute(f"ALTER TABLE {table} ADD COLUMN {col} TEXT DEFAULT NULL")
                        print(f"Added {col} to {table}")
                        has_changes = True
                    except Exception as e:
                        if "no such table" in str(e).lower():
                            try:
                                c.execute(f"CREATE TABLE {table} (id INTEGER PRIMARY KEY AUTOINCREMENT)")
                                print(f"Created table {table} (on demand)")
                                has_changes = True
                            except Exception as e2:
                                print(f"Could not create table {table}: {e2}")
                        elif "duplicate column name" not in str(e).lower():
                            print(f"Error adding {col} to {table}: {e}")
            elif "Table " in line and "not found" in line:
                m = re.search(r"Table (\S+) not found", line)
                if m:
                    table = m.group(1)
                    try:
                        c.execute(f"CREATE TABLE {table} (id INTEGER PRIMARY KEY AUTOINCREMENT)")
                        print(f"Created table {table}")
                        has_changes = True
                    except Exception as e:
                        pass
        
        conn.commit()

    conn.close()
    print("Done")

if __name__ == '__main__':
    fix_discrepancies()

import sys
import mysql.connector

try:
    with open('db/migrations/V010__outseason_verifications.sql', 'r') as f:
        sql = f.read()
except FileNotFoundError:
    print("SQL file not found")
    sys.exit(1)

try:
    # Use config from .env or previous scripts (hardcoded for brevity in this script)
    conn = mysql.connector.connect(
        host='31.11.39.161',
        database='Sql1804377_2',
        user='Sql1804377',
        password='u3z4t994$@psAPr',
        port=3306
    )
    cursor = conn.cursor()
    for result in cursor.execute(sql, multi=True):
        print(f"Executed: {result.statement[:60]}...")
    conn.commit()
    print("Migration V010 applied successfully to production DB!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error connecting or executing: {e}")

import sys
import mysql.connector

sql = "ALTER TABLE societa_sponsors ADD COLUMN tipo VARCHAR(50) DEFAULT 'Sponsor' AFTER name;"

try:
    conn = mysql.connector.connect(
        host='31.11.39.161',
        database='Sql1804377_2',
        user='Sql1804377',
        password='u3z4t994$@psAPr',
        port=3306
    )
    cursor = conn.cursor()
    cursor.execute(sql)
    conn.commit()
    print("Migration applied successfully to production DB!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error connecting or executing: {e}")

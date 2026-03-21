import mysql.connector

try:
    conn = mysql.connector.connect(
        host='31.11.39.161',
        database='Sql1804377_2',
        user='Sql1804377',
        password='u3z4t994$@psAPr',
        port=3306
    )
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'atleta';")
    
    # Just output the tenants to verify TNT_default is there
    cursor.execute("SELECT id, name FROM tenants;")
    print("Tenants in production:")
    for row in cursor.fetchall():
        print(row)
        
    conn.commit()
    print("MIGRATION APPLIED ON PRODUCTION DB SUCCESSFULLY!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error connecting or executing: {e}")

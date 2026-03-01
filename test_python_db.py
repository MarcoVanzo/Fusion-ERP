import mysql.connector

db_config = {
    'host': '31.11.39.161',
    'port': 3306,
    'user': 'Sql1804377',
    'password': 'u3z4t994$@psAPr',
    'database': 'Sql1804377_1'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM athletes")
    print(f"Total athletes: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM athletes a JOIN teams t ON a.team_id = t.id WHERE a.deleted_at IS NULL AND a.is_active = 1")
    print(f"Athletes with valid teams: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT team_id, COUNT(*) FROM athletes GROUP BY team_id")
    print("\nTeam IDs in athletes:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
        
    cursor.execute("SELECT id FROM teams")
    print("\nValid Team IDs in teams:")
    for row in cursor.fetchall():
        print(f"  {row[0]}")
        
except mysql.connector.Error as err:
    print(f"DB Error: {err}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()

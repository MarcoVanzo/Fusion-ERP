import mysql.connector

conn = mysql.connector.connect(
    host='31.11.39.161',
    database='Sql1804377_2',
    user='Sql1804377',
    password='u3z4t994$@psAPr',
    port=3306
)
cursor = conn.cursor(dictionary=True)

sql = """
SELECT s.id, s.first_name, s.last_name,
       GROUP_CONCAT(t.id SEPARATOR ',') as team_ids,
       GROUP_CONCAT(COALESCE(CONCAT(t.category, ' — ', t.name), t.name) SEPARATOR ', ') as team_names
FROM staff_members s
LEFT JOIN staff_teams st ON s.id = st.staff_id
LEFT JOIN teams t ON st.team_id = t.id AND t.deleted_at IS NULL
WHERE s.is_deleted = 0
GROUP BY s.id
"""
cursor.execute(sql)
rows = cursor.fetchall()

print(f"Total rows: {len(rows)}")
for r in rows:
    if r['team_ids']:
        print(f"Staff: {r['first_name']} {r['last_name']}")
        print(f"  Teams: {r['team_names']}")
        print(f"  IDs: {r['team_ids']}")
        
cursor.close()
conn.close()

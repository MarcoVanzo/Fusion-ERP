import mysql.connector
import os

# Load .env
with open('.env') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip().strip("'\"")

def check():
    conn = mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', 3306)),
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASS'),
        database=os.environ.get('DB_NAME')
    )
    cursor = conn.cursor(dictionary=True)
    
    # Check ec_products
    cursor.execute("SELECT id, tenant_id, nome, prezzo FROM ec_products LIMIT 10")
    products = cursor.fetchall()
    
    print("=== ec_products ===")
    if not products:
        print("Empty table or no results.")
    else:
        for p in products:
            print(p)
            
    # Count products
    cursor.execute("SELECT COUNT(*) as c, tenant_id FROM ec_products GROUP BY tenant_id")
    print(f"Product counts: {cursor.fetchall()}")

    # Check ec_orders
    cursor.execute("SELECT cognito_id, tenant_id, nome_cliente FROM ec_orders LIMIT 10")
    orders = cursor.fetchall()
    
    print("=== ec_orders ===")
    if not orders:
        print("Empty table or no results.")
    else:
        for o in orders:
            print(o)

    cursor.execute("SELECT COUNT(*) as c, tenant_id FROM ec_orders GROUP BY tenant_id")
    print(f"Order counts: {cursor.fetchall()}")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    check()

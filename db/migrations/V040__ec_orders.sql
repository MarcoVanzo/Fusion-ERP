CREATE TABLE IF NOT EXISTS ec_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    cognito_id VARCHAR(50) UNIQUE,
    nome_cliente VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(50),
    articoli JSON,
    totale DECIMAL(10,2) DEFAULT 0.00,
    metodo_pagamento VARCHAR(100),
    stato_forms VARCHAR(50) DEFAULT 'da definire',
    stato_interno VARCHAR(50) DEFAULT 'da definire',
    data_ordine TIMESTAMP NULL,
    order_summary JSON,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_ec_orders_tenant_stato ON ec_orders(tenant_id, stato_interno);
CREATE INDEX idx_ec_orders_tenant_data ON ec_orders(tenant_id, data_ordine);

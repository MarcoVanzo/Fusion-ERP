CREATE TABLE IF NOT EXISTS ec_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cognito_id VARCHAR(50) UNIQUE,
    nome_cliente VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(50),
    articoli TEXT,
    totale DECIMAL(10,2) DEFAULT 0.00,
    metodo_pagamento VARCHAR(100),
    stato_forms VARCHAR(50) DEFAULT 'da definire',
    stato_interno VARCHAR(50) DEFAULT 'da definire',
    data_ordine TIMESTAMP NULL,
    order_summary TEXT,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

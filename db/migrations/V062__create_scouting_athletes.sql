CREATE TABLE IF NOT EXISTS scouting_athletes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cognome VARCHAR(255) NOT NULL,
    societa_appartenenza VARCHAR(255),
    anno_nascita INT,
    note TEXT,
    rilevatore VARCHAR(255),
    data_rilevazione DATE,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

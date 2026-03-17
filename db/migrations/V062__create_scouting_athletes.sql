CREATE TABLE IF NOT EXISTS scouting_athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    cognome VARCHAR(255) NOT NULL,
    societa_appartenenza VARCHAR(255),
    anno_nascita INTEGER,
    note TEXT,
    rilevatore VARCHAR(255),
    data_rilevazione DATE,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

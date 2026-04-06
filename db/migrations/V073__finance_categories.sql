-- V073: Aggiunta tabella finance_categories per gestione dinamica delle categorie finanziarie
CREATE TABLE IF NOT EXISTS finance_categories (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    type ENUM('entrata', 'uscita', 'entrambi') DEFAULT 'entrambi',
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserimento categorie iniziali (Seeding)
INSERT INTO finance_categories (id, tenant_id, label, type, display_order) VALUES
('quote', 'default', 'Quote Associative', 'entrata', 10),
('sponsor', 'default', 'Sponsorizzazioni', 'entrata', 20),
('contributi', 'default', 'Contributi Pubblici', 'entrata', 30),
('donazioni', 'default', 'Donazioni Liberali', 'entrata', 40),
('eventi', 'default', 'Eventi e Tornei', 'entrambi', 50),
('spese_generali', 'default', 'Spese Generali', 'uscita', 60),
('trasporto', 'default', 'Trasporti e Trasferte', 'uscita', 70),
('foresteria', 'default', 'Spese Foresteria', 'uscita', 80),
('personale', 'default', 'Collaboratori e Personale', 'uscita', 90),
('materiale', 'default', 'Materiale Sportivo', 'uscita', 100);

-- V032__vehicles.sql — Gestione Mezzi (Vehicles Management)

CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    capacity INT DEFAULT 9,
    status ENUM('active', 'maintenance', 'out_of_service') DEFAULT 'active',
    insurance_expiry DATE NULL,
    road_tax_expiry DATE NULL,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id VARCHAR(20) NOT NULL,
    vehicle_id VARCHAR(20) NOT NULL,
    maintenance_date DATE NOT NULL,
    type ENUM('tagliando', 'gomme_estive', 'gomme_invernali', 'riparazione', 'revisione', 'altro') NOT NULL,
    description TEXT NULL,
    cost DECIMAL(10, 2) DEFAULT 0.00,
    mileage INT NULL, -- Km
    next_maintenance_date DATE NULL,
    next_maintenance_mileage INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_vehicle_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_anomalies (
    id VARCHAR(20) NOT NULL,
    vehicle_id VARCHAR(20) NOT NULL,
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reporter_id VARCHAR(36) NULL, -- Assuming user IDs might be longer, usually matches users table
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    resolution_notes TEXT NULL,
    resolved_date DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_vehicle_anomalies_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

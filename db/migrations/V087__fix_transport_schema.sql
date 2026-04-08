-- V087__fix_transport_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Fix remaining schema discrepancies found in final audit.
--
-- Resolves:
--   P1: mileage_reimbursements columns mismatch (user_id, rate_eur_km, total_eur, pdf_path)
--   P4: transports missing vehicle_id column
--   P5: ec_orders table missing from migrations
--   P6: tenant_settings table missing from migrations
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Helper: safe_add_column ─────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS safe_add_column;

DELIMITER //
CREATE PROCEDURE safe_add_column(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    SET @tbl_exists = 0;
    SELECT COUNT(*) INTO @tbl_exists
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table;

    IF @tbl_exists = 0 THEN
        SET @col_exists = 1;
    ELSE
        SET @col_exists = 0;
        SELECT COUNT(*) INTO @col_exists
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column;
    END IF;

    IF @col_exists = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- P1: mileage_reimbursements — add columns used by TransportRepository
--
-- The V085 CREATE TABLE defined: id, tenant_id, carpool_id, driver_id, event_id,
-- distance_km, amount_eur, status, notes, created_at.
-- But TransportRepository uses: user_id, rate_eur_km, total_eur, pdf_path.
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('mileage_reimbursements', 'user_id', "VARCHAR(20) NULL AFTER `carpool_id`");
CALL safe_add_column('mileage_reimbursements', 'rate_eur_km', "DECIMAL(5,2) NULL COMMENT 'Rate per km in EUR'");
CALL safe_add_column('mileage_reimbursements', 'total_eur', "DECIMAL(8,2) NULL COMMENT 'Total reimbursement in EUR'");
CALL safe_add_column('mileage_reimbursements', 'pdf_path', "VARCHAR(500) NULL COMMENT 'Path to generated PDF receipt'");

-- ═══════════════════════════════════════════════════════════════════════════════
-- P4: transports — add vehicle_id (frontend sends it, controller accepts it)
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('transports', 'vehicle_id', "VARCHAR(20) NULL AFTER `driver_id`");

-- ═══════════════════════════════════════════════════════════════════════════════
-- P5: ec_orders — eCommerce orders table (used by EcommerceController)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `ec_orders` (
    `id`                INT AUTO_INCREMENT PRIMARY KEY,
    `cognito_id`        VARCHAR(100) NOT NULL,
    `nome_cliente`      VARCHAR(255) NULL,
    `email`             VARCHAR(255) NULL,
    `telefono`          VARCHAR(50)  NULL,
    `articoli`          JSON         NULL,
    `totale`            DECIMAL(10,2) DEFAULT 0.00,
    `metodo_pagamento`  VARCHAR(100) NULL,
    `stato_forms`       VARCHAR(50)  NULL,
    `stato_interno`     VARCHAR(50)  DEFAULT 'nuovo',
    `data_ordine`       DATETIME     NULL,
    `order_summary`     TEXT         NULL,
    `raw_data`          JSON         NULL,
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_cognito_id` (`cognito_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- P6: tenant_settings — key-value store used by NetworkRepository hub config
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `tenant_settings` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id`      VARCHAR(20)  NOT NULL,
    `setting_key`    VARCHAR(100) NOT NULL,
    `setting_value`  TEXT         NULL,
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_tenant_setting` (`tenant_id`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP
-- ═══════════════════════════════════════════════════════════════════════════════
DROP PROCEDURE IF EXISTS safe_add_column;

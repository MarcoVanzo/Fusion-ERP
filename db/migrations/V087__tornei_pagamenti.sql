-- V087__tornei_pagamenti.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Feature: Quote Tornei (Per Evento)
-- Aggiunge la colonna has_paid alla tabella event_attendees per tracciare
-- individualmente il pagamento di ciascun torneo.
-- Rimuove colonne obsolete generate da V086.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP PROCEDURE IF EXISTS safe_add_column_087;
DROP PROCEDURE IF EXISTS safe_drop_column_087;

DELIMITER //
CREATE PROCEDURE safe_add_column_087(
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

    IF @tbl_exists = 1 THEN
        SET @col_exists = 0;
        SELECT COUNT(*) INTO @col_exists
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column;

        IF @col_exists = 0 THEN
            SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
            PREPARE stmt FROM @ddl;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END //

CREATE PROCEDURE safe_drop_column_087(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64)
)
BEGIN
    SET @tbl_exists = 0;
    SELECT COUNT(*) INTO @tbl_exists
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table;

    IF @tbl_exists = 1 THEN
        SET @col_exists = 0;
        SELECT COUNT(*) INTO @col_exists
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column;

        IF @col_exists = 1 THEN
            SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP COLUMN `', p_column, '`');
            PREPARE stmt FROM @ddl;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END //
DELIMITER ;

CALL safe_add_column_087('event_attendees', 'has_paid', "TINYINT(1) DEFAULT 0 AFTER `status`");

-- Pulizia V086 obsoleta
CALL safe_drop_column_087('athletes', 'quota_tornei_paid');
CALL safe_drop_column_087('athletes', 'quota_tornei');

DROP PROCEDURE IF EXISTS safe_add_column_087;
DROP PROCEDURE IF EXISTS safe_drop_column_087;

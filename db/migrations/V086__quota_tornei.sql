-- V086__quota_tornei.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Feature: Quote Tornei per Atleti
-- Aggiunge campi per calcolare e salvare la quota totale dovuta per i tornei 
-- e lo stato del pagamento.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP PROCEDURE IF EXISTS safe_add_column_086;

DELIMITER //
CREATE PROCEDURE safe_add_column_086(
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
DELIMITER ;

CALL safe_add_column_086('athletes', 'quota_tornei', "DECIMAL(10,2) DEFAULT 0.00 AFTER `quota_trasporti_paid`");
CALL safe_add_column_086('athletes', 'quota_tornei_paid', "TINYINT(1) DEFAULT 0 AFTER `quota_tornei`");

DROP PROCEDURE IF EXISTS safe_add_column_086;

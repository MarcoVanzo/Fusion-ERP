-- V130: Add 'saldo' column to outseason_entries
-- Saldo = remaining balance after deposit (caparra) is paid
-- Auto-populated when bank statement PDF is verified via AI

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

-- ─── Add saldo column ───────────────────────────────────────────────────────
CALL safe_add_column('outseason_entries', 'saldo', "DECIMAL(10,2) NULL COMMENT 'Saldo residuo dopo caparra'");

-- Clean up
DROP PROCEDURE IF EXISTS safe_add_column;

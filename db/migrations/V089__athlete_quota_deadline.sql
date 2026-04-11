-- V089__athlete_quota_deadline.sql
-- Aggiunge la colonna per la data di scadenza pagamenti quote per le atlete.
-- Made idempotent via safe_add_column pattern.

DROP PROCEDURE IF EXISTS safe_add_column_089;

DELIMITER //
CREATE PROCEDURE safe_add_column_089(
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

CALL safe_add_column_089('athletes', 'quota_payment_deadline', "DATE DEFAULT NULL AFTER `quota_foresteria_paid`");

DROP PROCEDURE IF EXISTS safe_add_column_089;

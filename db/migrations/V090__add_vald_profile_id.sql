-- V090__add_vald_profile_id.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds the missing vald_profile_id column to athletes table.
-- This column was defined in V033 but never applied to production,
-- causing SQLSTATE[42S22] errors in listAthletesLight and VALD module.
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- Add vald_profile_id to athletes
CALL safe_add_column('athletes', 'vald_profile_id', "VARCHAR(100) DEFAULT NULL");

-- Add index for faster lookups
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'athletes'
  AND INDEX_NAME = 'idx_vald_profile_id';

SET @add_idx = IF(@idx_exists = 0,
    'ALTER TABLE `athletes` ADD INDEX `idx_vald_profile_id` (`vald_profile_id`)',
    'SELECT 1');
PREPARE stmt FROM @add_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cleanup
DROP PROCEDURE IF EXISTS safe_add_column;

-- V118: Add tenant_id to tables that are missing multi-tenant isolation.
-- Uses a stored procedure to safely skip columns that already exist.
--
-- IMPORTANT: This migration assumes single-tenant data (TNT_fusion) exists.
-- All existing rows receive the default tenant to preserve data integrity.

DROP PROCEDURE IF EXISTS _v118_safe_add_tenant;

DELIMITER $$
CREATE PROCEDURE _v118_safe_add_tenant(IN tbl VARCHAR(64), IN nullable BOOLEAN)
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = 'tenant_id';
    
    IF col_exists = 0 THEN
        IF nullable THEN
            SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN tenant_id VARCHAR(50) DEFAULT ''TNT_fusion''');
        ELSE
            SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT ''TNT_fusion''');
        END IF;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        SET @idx = CONCAT('CREATE INDEX idx_', tbl, '_tenant ON `', tbl, '` (tenant_id)');
        PREPARE stmt2 FROM @idx;
        EXECUTE stmt2;
        DEALLOCATE PREPARE stmt2;
    END IF;
END$$
DELIMITER ;

-- ═══ Core tables ═══
CALL _v118_safe_add_tenant('events', FALSE);
CALL _v118_safe_add_tenant('tasks', FALSE);
CALL _v118_safe_add_tenant('transports', FALSE);
CALL _v118_safe_add_tenant('contracts', FALSE);
CALL _v118_safe_add_tenant('documents', FALSE);
CALL _v118_safe_add_tenant('gyms', FALSE);
CALL _v118_safe_add_tenant('attendances', FALSE);
CALL _v118_safe_add_tenant('tournament_details', FALSE);
CALL _v118_safe_add_tenant('tournament_expenses', FALSE);
CALL _v118_safe_add_tenant('tournament_matches', FALSE);
CALL _v118_safe_add_tenant('federation_standings', FALSE);

-- ═══ System/reference tables ═══
CALL _v118_safe_add_tenant('audit_logs', TRUE);
CALL _v118_safe_add_tenant('users', FALSE);

-- ═══ Linking/child tables ═══
CALL _v118_safe_add_tenant('athlete_teams', FALSE);
CALL _v118_safe_add_tenant('staff_teams', FALSE);
CALL _v118_safe_add_tenant('login_attempts', TRUE);
CALL _v118_safe_add_tenant('password_history', TRUE);

-- Cleanup
DROP PROCEDURE IF EXISTS _v118_safe_add_tenant;

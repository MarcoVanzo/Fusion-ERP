-- Unify User Auth to match MV ERP
-- Add security fields to users
ALTER TABLE `users`
    ADD COLUMN `status` ENUM('Attivo', 'Invitato', 'Disattivato') DEFAULT 'Attivo',
    ADD COLUMN `blocked` TINYINT(1) DEFAULT 0,
    ADD COLUMN `failed_attempts` INT DEFAULT 0,
    ADD COLUMN `must_change_password` TINYINT(1) DEFAULT 0,
    ADD COLUMN `verification_token` VARCHAR(255) DEFAULT NULL,
    ADD COLUMN `token_expires_at` DATETIME DEFAULT NULL;

-- Migrate existing is_active logic to status
UPDATE `users` SET `status` = 'Attivo' WHERE `is_active` = 1;
UPDATE `users` SET `status` = 'Disattivato' WHERE `is_active` = 0;

-- Create password history table
CREATE TABLE IF NOT EXISTS `password_history` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    VARCHAR(20) NOT NULL,
  `pwd_hash`   VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pwdhist_user` (`user_id`),
  KEY `idx_pwdhist_created` (`created_at`),
  CONSTRAINT `fk_pwdhist_user` FOREIGN KEY (`user_id`)
      REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

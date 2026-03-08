-- Migration V026: Setup CMS/Website module tables

CREATE TABLE IF NOT EXISTS `website_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `color_hex` VARCHAR(10) DEFAULT '#000000',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `website_news` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` INT DEFAULT NULL,
    `author_id` INT DEFAULT NULL,
    `category_id` INT DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `cover_image_url` VARCHAR(500) DEFAULT NULL,
    `excerpt` TEXT DEFAULT NULL,
    `content_html` LONGTEXT DEFAULT NULL,
    `is_published` TINYINT(1) DEFAULT 0,
    `published_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_website_news_category` FOREIGN KEY (`category_id`) REFERENCES `website_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `website_hero_slides` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` INT DEFAULT NULL,
    `title` VARCHAR(255) DEFAULT NULL,
    `subtitle` VARCHAR(255) DEFAULT NULL,
    `media_type` ENUM('image', 'video') DEFAULT 'image',
    `media_url` VARCHAR(500) NOT NULL,
    `button_text` VARCHAR(100) DEFAULT NULL,
    `button_link` VARCHAR(500) DEFAULT NULL,
    `sort_order` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `website_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` INT DEFAULT NULL,
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_tenant_setting` (`tenant_id`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default categories
INSERT IGNORE INTO `website_categories` (`name`, `slug`, `color_hex`) VALUES 
('Prima Squadra', 'prima-squadra', '#0047AB'),
('Settore Giovanile', 'giovanili', '#FF8C00'),
('Eventi', 'eventi', '#228B22'),
('Società', 'societa', '#696969');

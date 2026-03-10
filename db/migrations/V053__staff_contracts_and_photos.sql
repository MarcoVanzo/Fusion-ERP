-- V053__staff_contracts_and_photos.sql
-- Add fields for photo and contract generation capabilities to staff_members table

ALTER TABLE `staff_members`
    ADD COLUMN `photo_path` VARCHAR(255) NULL AFTER `notes`,
    
    -- Contract Fields
    ADD COLUMN `contract_status` VARCHAR(50) NULL AFTER `photo_path`,
    ADD COLUMN `contract_esign_document_id` VARCHAR(100) NULL AFTER `contract_status`,
    ADD COLUMN `contract_esign_signing_url` VARCHAR(255) NULL AFTER `contract_esign_document_id`,
    ADD COLUMN `contract_signed_pdf_path` VARCHAR(255) NULL AFTER `contract_esign_signing_url`,
    ADD COLUMN `contract_signed_at` DATETIME NULL AFTER `contract_signed_pdf_path`,
    
    ADD COLUMN `contract_valid_from` DATE NULL AFTER `contract_signed_at`,
    ADD COLUMN `contract_valid_to` DATE NULL AFTER `contract_valid_from`,
    ADD COLUMN `contract_monthly_fee` DECIMAL(10,2) NULL AFTER `contract_valid_to`;

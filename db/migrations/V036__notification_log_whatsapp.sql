-- V036__notification_log_whatsapp.sql — WhatsApp support for notification logs
-- Adds channel and recipient_phone to notification_log table.

ALTER TABLE notification_log 
    ADD COLUMN channel ENUM('EMAIL', 'WHATSAPP') NOT NULL DEFAULT 'EMAIL' AFTER notification_type,
    ADD COLUMN recipient_phone VARCHAR(30) NULL AFTER recipient_email;

-- Index on channel for filtering
ALTER TABLE notification_log ADD INDEX idx_notif_channel (channel);

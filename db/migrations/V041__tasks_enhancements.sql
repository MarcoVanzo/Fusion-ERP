-- V041__tasks_enhancements.sql
-- Aggiunge colonne ESITO e ATTACHMENT a task_logs,
-- e ATTACHMENT a tasks, per replicare le funzionalità to-do di MV ERP.

-- Esito dell'interazione (lista valori fissi, sostituisce il campo outcome libero)
ALTER TABLE `task_logs`
    ADD COLUMN IF NOT EXISTS `esito` VARCHAR(50) DEFAULT NULL
        COMMENT 'Non ha risposto | Interessato | Richiamare | Confermato | Non interessato | In attesa | Altro'
        AFTER `outcome`;

-- Allegato base64 sul log (immagine/PDF/doc, max ~5 MB come data-URI)
ALTER TABLE `task_logs`
    ADD COLUMN IF NOT EXISTS `attachment` LONGTEXT DEFAULT NULL
        COMMENT 'File allegato in formato base64 data-URI'
        AFTER `esito`;

-- Allegato base64 sul task
ALTER TABLE `tasks`
    ADD COLUMN IF NOT EXISTS `attachment` LONGTEXT DEFAULT NULL
        COMMENT 'File allegato in formato base64 data-URI'
        AFTER `notes`;

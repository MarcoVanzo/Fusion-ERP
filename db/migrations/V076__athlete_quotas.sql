-- Aggiunta tipologie quote e stato pagamenti atleti

ALTER TABLE athletes
ADD COLUMN quota_iscrizione_rata1 DECIMAL(10,2) DEFAULT NULL AFTER image_release_consent,
ADD COLUMN quota_iscrizione_rata1_paid TINYINT(1) DEFAULT 0 AFTER quota_iscrizione_rata1,
ADD COLUMN quota_iscrizione_rata2 DECIMAL(10,2) DEFAULT NULL AFTER quota_iscrizione_rata1_paid,
ADD COLUMN quota_iscrizione_rata2_paid TINYINT(1) DEFAULT 0 AFTER quota_iscrizione_rata2,
ADD COLUMN quota_vestiario DECIMAL(10,2) DEFAULT NULL AFTER quota_iscrizione_rata2_paid,
ADD COLUMN quota_vestiario_paid TINYINT(1) DEFAULT 0 AFTER quota_vestiario,
ADD COLUMN quota_foresteria DECIMAL(10,2) DEFAULT NULL AFTER quota_vestiario_paid,
ADD COLUMN quota_foresteria_paid TINYINT(1) DEFAULT 0 AFTER quota_foresteria;

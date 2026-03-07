-- V037__whatsapp_inbox.sql — WhatsApp Inbox (messaggi ricevuti)
-- Tabella per i messaggi in entrata dal webhook Meta Cloud API

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id              VARCHAR(40)     NOT NULL,
    wa_message_id   VARCHAR(100)    NOT NULL,
    from_phone      VARCHAR(30)     NOT NULL,
    message_type    ENUM('text','image','document','audio','video','reaction','interactive','unknown')
                                    NOT NULL DEFAULT 'text',
    body            TEXT            NULL,                          -- testo principale (o caption per media)
    media_id        VARCHAR(100)    NULL,                          -- per messaggi con allegati
    timestamp       BIGINT UNSIGNED NOT NULL,                      -- Unix timestamp da Meta
    status          ENUM('received','read','replied')
                                    NOT NULL DEFAULT 'received',
    athlete_id      VARCHAR(40)     NULL,                          -- opzionale: collegato a un atleta
    tenant_id       VARCHAR(40)     NOT NULL DEFAULT 'TNT_default',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY  uq_wa_msg_id      (wa_message_id),
    INDEX       idx_from_phone    (from_phone),
    INDEX       idx_athlete       (athlete_id),
    INDEX       idx_status        (status),
    INDEX       idx_created       (created_at),
    CONSTRAINT  fk_wamsg_athlete
        FOREIGN KEY (athlete_id)
        REFERENCES  athletes(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

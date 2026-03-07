-- V026__invoices.sql — E-Invoicing (Fatturazione Elettronica SDI)
-- Invoices with SDI integration fields, ready for provider API

CREATE TABLE IF NOT EXISTS invoices (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    invoice_number  VARCHAR(30)  NOT NULL,
    type            VARCHAR(20)  NOT NULL DEFAULT 'ricevuta',  -- fattura, ricevuta, nota_credito, proforma
    direction       VARCHAR(10)  NOT NULL DEFAULT 'out',       -- out = emessa, in = ricevuta
    -- Recipient
    recipient_name  VARCHAR(200) NOT NULL,
    recipient_cf    VARCHAR(16)  NULL,
    recipient_piva  VARCHAR(11)  NULL,
    recipient_address VARCHAR(300) NULL,
    sdi_code        VARCHAR(7)   NULL,
    pec             VARCHAR(255) NULL,
    -- Amounts
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate        DECIMAL(5,2)  NOT NULL DEFAULT 0,     -- 0 for ASD exempt operations
    tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Line items stored as JSON for flexibility
    line_items      JSON         NULL,                    -- [{description, qty, unit_price, amount}]
    -- SDI Integration
    status          VARCHAR(30)  NOT NULL DEFAULT 'draft', -- draft, sent, delivered, accepted, rejected
    sdi_id          VARCHAR(50)  NULL,             -- ID from SDI provider
    sdi_response    JSON         NULL,             -- full SDI response
    xml_path        VARCHAR(500) NULL,
    pdf_path        VARCHAR(500) NULL,
    sent_at         DATETIME     NULL,
    -- Payment link
    payment_id      VARCHAR(20)  NULL,             -- FK to payments_invoices if linked
    journal_entry_id VARCHAR(20) NULL,             -- FK to journal_entries if booked
    -- Meta
    notes           TEXT         NULL,
    created_by      VARCHAR(20)  NULL,
    deleted_at      DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_inv_tenant (tenant_id),
    INDEX idx_inv_number (tenant_id, invoice_number),
    INDEX idx_inv_status (status),
    INDEX idx_inv_date (created_at),
    CONSTRAINT fk_inv_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_creator FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── INVOICE NUMBERING SEQUENCE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_sequences (
    tenant_id   VARCHAR(20) NOT NULL,
    year        SMALLINT    NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'fattura',
    last_number INT         NOT NULL DEFAULT 0,
    prefix      VARCHAR(10) NULL,                 -- e.g. "FT", "RC"
    PRIMARY KEY (tenant_id, year, type),
    CONSTRAINT fk_invseq_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

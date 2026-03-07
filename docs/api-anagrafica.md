# Anagrafica Module — API Documentation

## New Modules

All endpoints require session authentication. Access is controlled by role via `Auth::requireRead`/`requireWrite`.

---

## Biometrics (`?module=biometrics`)

| Action | Method | Params | Role (write) | Description |
|---|---|---|---|---|
| `addBiometric` | POST | `athlete_id, record_date, height_cm?, weight_kg?, wingspan_cm?, notes?` | allenatore, manager, admin | Add biometric measurement. BMI auto-calculated. |
| `getBiometrics` | GET | `id` (athlete) | All with biometrics read | Biometric history + latest record |
| `addMetric` | POST | `athlete_id, record_date, metric_type, value, unit, notes?` | allenatore, manager, admin | Add athletic performance metric |
| `getMetrics` | GET | `id` (athlete), `type?` | All with biometrics read | Metric history, filterable by type |
| `getMetricsSummary` | GET | `id` (athlete) | All with biometrics read | Latest value + trend per metric type |
| `metricTypes` | GET | — | All with biometrics read | List valid metric type enum values |

**Metric Types**: `SPRINT_10M, SPRINT_20M, SPRINT_40M, VERTICAL_JUMP_CMJ, VERTICAL_JUMP_SJ, BROAD_JUMP, BEEP_TEST, VO2MAX, REST_HEART_RATE, MAX_HEART_RATE, RPE, HRV, TRAINING_LOAD, STRENGTH_1RM`

---

## Health (`?module=health`)

| Action | Method | Params | Role (write) | Description |
|---|---|---|---|---|
| `updateCertificate` | POST | `athlete_id, cert_type?, expires_at?, issued_at?, file_path?` | medico, manager, admin | Update medical certificate |
| `getCertificateStatus` | GET | `id` (athlete) | allenatore, medico, manager, admin | Certificate status with alert level |
| `addInjury` | POST | `athlete_id, injury_date, type, body_part, severity?, stop_days?, return_date?, notes?, treated_by?` | medico, manager, admin | Log injury |
| `getInjuries` | GET | `id` (athlete) | allenatore, medico, manager, admin | Injury history |
| `updateInjury` | POST | `injury_id, return_date?, notes?, stop_days?` | medico, manager, admin | Update injury (e.g. return-to-play) |

**Alert Levels**: `NONE, WARNING_30, WARNING_15, URGENT_7, EXPIRED`

---

## Documents (`?module=documents`)

| Action | Method | Params | Role (write) | Description |
|---|---|---|---|---|
| `upload` | POST (multipart) | `athlete_id, doc_type, file, expiry_date?` | operatore, manager, admin | Upload document (max 10MB, PDF/JPG/PNG/WEBP) |
| `list` | GET | `id` (athlete), `type?` | Role-filtered | List documents (coaches see limited types) |
| `download` | GET | `docId` | All with documents read | Download/view document |
| `delete` | POST | `doc_id` | operatore, manager, admin | Soft-delete with audit |
| `docTypes` | GET | — | All with documents read | List valid document types |

**Doc Types**: `ID_CARD, PASSPORT, FEDERATION_CARD, BIRTH_CERTIFICATE, IMAGE_RELEASE, GDPR_CONSENT, MEDICAL_CERTIFICATE, CONTRACT, SPORTS_LICENSE, OTHER`

---

## Payments (`?module=payments`)

| Action | Method | Params | Role (write) | Description |
|---|---|---|---|---|
| `createPlan` | POST | `athlete_id, total_amount, frequency, start_date, season?, notes?` | operatore, manager, admin | Create plan + auto-generate installments |
| `getPlan` | GET | `id` (athlete) | operatore, genitore, manager, admin | Active plan + installments + stats |
| `payInstallment` | POST | `installment_id, payment_method, paid_date?, reference?` | operatore, manager, admin | Mark installment as paid + log transaction |
| `generateReceipt` | POST | `installment_id` | operatore, manager, admin | Generate PDF receipt via mPDF |
| `dashboard` | GET | — | operatore, manager, admin | Admin payment overview (outstanding, overdue, monthly) |
| `overdueList` | GET | — | operatore, manager, admin | Athletes with overdue installments |

**Frequencies**: `MONTHLY (10 rate), QUARTERLY (4), SEMI_ANNUAL (2), ANNUAL (1)`
**Payment Methods**: `BANK_TRANSFER, CARD, CASH, SEPA, STRIPE, OTHER`

---

## Athletes — New Actions (`?module=athletes`)

| Action | Method | Params | Role (write) | Description |
|---|---|---|---|---|
| `guardians` | GET | `id` (athlete) | All with athletes read | List guardians |
| `addGuardian` | POST | `athlete_id, full_name, relationship, phone?, email?, fiscal_code?, is_primary?` | athletes write | Add guardian |
| `removeGuardian` | POST | `guardian_id` | athletes write | Remove guardian |
| `gdprConsents` | GET | `id` (athlete) | All with athletes read | List GDPR consents |
| `addGdprConsent` | POST | `athlete_id, consent_type, granted, notes?` | athletes write | Record consent (auto-captures IP + timestamp) |
| `revokeGdprConsent` | POST | `consent_id` | athletes write | Revoke consent |

**Consent Types**: `DATA_PROCESSING, IMAGE_RELEASE, MARKETING, HEALTH_DATA`

---

## Cron Job

```bash
# Daily at 7:00 AM
0 7 * * * cd /path/to/fusionerp && php api/cron/cron_alerts.php >> /tmp/fusion_cron.log 2>&1
```

Checks: certificate expiry (30/15/7/0 days), document expiry, marks overdue installments, sends payment reminders (7 days before due).

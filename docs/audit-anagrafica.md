# Audit Anagrafica — Fusion ERP

> Generated: 2026-03-04

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.2 (vanilla, no framework) |
| Database | MySQL 8 (InnoDB, utf8mb4) |
| Frontend | Vanilla JavaScript (ES6 modules) |
| CSS | Custom CSS (dark neon theme) |
| Dependencies | vlucas/phpdotenv, mpdf/mpdf, phpmailer/phpmailer |
| Auth | Session-based with RBAC matrix in `Auth.php` |
| Multi-tenant | `TenantContext` resolution per request |

---

## 2. Current Data Model — `athletes` table

### 2a. Field Inventory

| Field | Type | Source | Status |
|---|---|---|---|
| `id` | VARCHAR(20) | V002 | ✅ PRESENT |
| `user_id` | VARCHAR(20) | V002 | ✅ PRESENT |
| `team_id` | VARCHAR(20) | V002 | ✅ PRESENT |
| `first_name` | VARCHAR(80) | V008 | ✅ PRESENT |
| `last_name` | VARCHAR(80) | V008 | ✅ PRESENT |
| `full_name` | VARCHAR(150) GENERATED | V008 | ✅ PRESENT |
| `jersey_number` | TINYINT | V002 | ✅ PRESENT |
| `role` | VARCHAR(50) | V002 | ✅ PRESENT |
| `birth_date` | DATE | V002 | ✅ PRESENT |
| `birth_place` | VARCHAR(150) | V008 | ✅ PRESENT |
| `height_cm` | SMALLINT | V002 | ⚠️ INCOMPLETE — single value, no time-series |
| `weight_kg` | DECIMAL(5,1) | V002 | ⚠️ INCOMPLETE — single value, no time-series |
| `photo_path` | VARCHAR(500) | V002 | ✅ PRESENT |
| `parent_contact` | VARCHAR(150) | V002 | ⚠️ INCOMPLETE — no guardian entity |
| `parent_phone` | VARCHAR(30) | V002 | ⚠️ INCOMPLETE — no guardian entity |
| `phone` | VARCHAR(30) | V008 | ✅ PRESENT |
| `email` | VARCHAR(150) | V008 | ✅ PRESENT |
| `residence_address` | VARCHAR(255) | V006 | ✅ PRESENT |
| `residence_city` | VARCHAR(100) | V008 | ✅ PRESENT |
| `fiscal_code` | VARCHAR(16) | V006 | ✅ PRESENT |
| `identity_document` | VARCHAR(50) | V006 | ⚠️ INCOMPLETE — text only, no file |
| `federal_id` | VARCHAR(50) | V006 | ✅ PRESENT |
| `medical_cert_type` | VARCHAR(20) | V006 | ⚠️ INCOMPLETE — no file upload, no issue date |
| `medical_cert_expires_at` | DATE | V006 | ⚠️ INCOMPLETE — no expiry alerts |
| `registration_form_signed` | TINYINT(1) | V006 | ✅ PRESENT |
| `privacy_consent_signed` | TINYINT(1) | V006 | ⚠️ INCOMPLETE — boolean only, no GDPR details |
| `shirt_size` | VARCHAR(10) | V006 | ✅ PRESENT |
| `shoe_size` | VARCHAR(10) | V006 | ✅ PRESENT |
| `is_active` | TINYINT(1) | V002 | ✅ PRESENT |
| `deleted_at` | DATETIME | V002 | ✅ PRESENT |
| `created_at` | DATETIME | V002 | ✅ PRESENT |
| `updated_at` | DATETIME | V002 | ✅ PRESENT |

### 2b. Existing Relationships

| Relation | Table | Type |
|---|---|---|
| athlete → team | `teams` | FK `team_id` |
| athlete → user | `users` | FK `user_id` (optional) |
| athlete → metrics | `metrics_logs` | FK `athlete_id` |
| athlete → AI summaries | `ai_summaries` | FK `athlete_id` |
| athlete → ACWR alerts | `acwr_alerts` | FK `athlete_id` |
| athlete → payments | `payments_invoices` | via `athletes.user_id = pi.beneficiary_user_id` |
| athlete → federation cards | `federation_cards` | FK `athlete_id` |

---

## 3. Gap Analysis

| # | Feature | Industry Standard | Current Status | Priority |
|---|---|---|---|---|
| 1 | Biometric tracking (height, weight, BMI) | ✅ required | ⚠️ PARTIAL — single values on athlete, no history | **P0** |
| 2 | Athletic metrics (sprint, jump, VO2max) | ✅ required | ❌ MISSING — only ACWR training-load exists | **P0** |
| 3 | Time-series metrics history + charts | ✅ required | ⚠️ PARTIAL — ACWR table only, no line charts | **P0** |
| 4 | Medical certificate with expiry alerts | ✅ required | ⚠️ PARTIAL — expiry date stored, no alerts/file | **P0** |
| 5 | Injury log with return-to-play tracking | ✅ required | ❌ MISSING | **P0** |
| 6 | Document repository with OCR | ✅ required | ❌ MISSING | **P1** |
| 7 | Digital signature (minors consent) | ✅ required | ❌ MISSING | **P2** |
| 8 | Document expiry alerts (30/15/7 days) | ✅ required | ❌ MISSING | **P0** |
| 9 | Payment plans per athlete | ✅ required | ❌ MISSING — only flat invoices exist | **P0** |
| 10 | Installment tracking with overdue alerts | ✅ required | ❌ MISSING | **P0** |
| 11 | SEPA/Stripe/GoCardless integration | ✅ required | ❌ MISSING | **P1** |
| 12 | Auto PDF receipts | ✅ required | ❌ MISSING | **P1** |
| 13 | Guardian/parent management for minors | ✅ required | ⚠️ PARTIAL — 2 text fields, no entity | **P0** |
| 14 | Role-based access (coach/medical/admin) | ✅ required | ⚠️ PARTIAL — module-level RBAC, no field-level | **P1** |
| 15 | GDPR consent management | ✅ required | ⚠️ PARTIAL — single boolean flag | **P0** |
| 16 | Multi-sport configurable metrics | ✅ required | ❌ MISSING | **P1** |
| 17 | Unified athlete profile dashboard | ✅ required | ⚠️ PARTIAL — hero profile exists, no tabs | **P0** |
| 18 | Notification system (email alerts) | ✅ required | ❌ MISSING | **P0** |
| 19 | Emergency contact | ✅ required | ❌ MISSING | **P1** |
| 20 | Communication preference | ✅ required | ❌ MISSING | **P2** |
| 21 | Nationality | ✅ required | ❌ MISSING | **P1** |
| 22 | Blood group / allergies / medications | ✅ required | ❌ MISSING | **P1** |

---

## 4. Existing RBAC Matrix

Roles: `atleta`, `allenatore`, `operatore`, `manager`, `admin`

| Module | atleta | allenatore | operatore | manager | admin |
|---|---|---|---|---|---|
| athletes | read | write | read | write | write |
| health | — | write | — | write | write |
| compliance | — | — | read | write | write |
| finance | — | — | — | — | write |
| dashboard | — | read | read | read | write |

> **Gap**: No `MEDICAL_STAFF`, `SECRETARY`, or `PARENT` roles. No field-level restrictions (e.g. health data visible to coaches). The task requires mapping the new RBAC matrix onto the existing 5-role system or extending it.

---

## 5. Summary

The current anagrafica module provides a solid **core** (CRUD, team assignment, ACWR training load, AI reports, basic payments view). However, it is missing the majority of **industry-standard features**: biometric time-series, athletic performance metrics, injury tracking, document management, payment plans with installments, proper GDPR management, a notification/alert engine, and a unified tabbed profile dashboard.

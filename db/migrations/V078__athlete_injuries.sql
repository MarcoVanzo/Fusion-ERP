-- V078__athlete_injuries.sql
-- Expands the Athletes and Injury Records tables to support the full Athlete Medical History module.

-- 1. Expansions on Athletes table for Anamnesi General and Orthopedic
ALTER TABLE athletes ADD COLUMN chronic_diseases TEXT NULL AFTER medications;
ALTER TABLE athletes ADD COLUMN past_surgeries TEXT NULL AFTER chronic_diseases;
ALTER TABLE athletes ADD COLUMN past_injuries TEXT NULL AFTER past_surgeries;
ALTER TABLE athletes ADD COLUMN chronic_orthopedic_issues TEXT NULL AFTER past_injuries;
ALTER TABLE athletes ADD COLUMN orthopedic_aids TEXT NULL AFTER chronic_orthopedic_issues;

-- 2. Expansions on Injury Records table (some columns might already exist as required or simple strings, so we expand the detail)
-- Existing missing detailed columns
ALTER TABLE injury_records ADD COLUMN location_context VARCHAR(150) NULL AFTER body_part;
ALTER TABLE injury_records ADD COLUMN side VARCHAR(50) NULL AFTER location_context; -- 'LEFT', 'RIGHT', 'BILATERAL', 'N/A'
ALTER TABLE injury_records ADD COLUMN mechanism VARCHAR(150) NULL AFTER side; -- 'CONTACT', 'NON_CONTACT', 'OVERUSE'
ALTER TABLE injury_records ADD COLUMN official_diagnosis TEXT NULL AFTER mechanism;
ALTER TABLE injury_records ADD COLUMN diagnosis_date DATE NULL AFTER official_diagnosis;
ALTER TABLE injury_records ADD COLUMN diagnosed_by VARCHAR(150) NULL AFTER diagnosis_date;
ALTER TABLE injury_records ADD COLUMN instrumental_tests TEXT NULL AFTER diagnosed_by;
ALTER TABLE injury_records ADD COLUMN test_results TEXT NULL AFTER instrumental_tests;
ALTER TABLE injury_records ADD COLUMN is_recurrence TINYINT(1) NOT NULL DEFAULT 0 AFTER test_results;
ALTER TABLE injury_records ADD COLUMN treatment_type VARCHAR(100) NULL AFTER is_recurrence; -- 'CONSERVATIVE', 'SURGICAL'
ALTER TABLE injury_records ADD COLUMN surgery_date DATE NULL AFTER treatment_type;
ALTER TABLE injury_records ADD COLUMN physio_plan TEXT NULL AFTER surgery_date;
ALTER TABLE injury_records ADD COLUMN assigned_physio VARCHAR(150) NULL AFTER physio_plan;
ALTER TABLE injury_records ADD COLUMN current_status VARCHAR(100) NULL AFTER assigned_physio; -- 'INJURED', 'REHAB', 'DIFFERENTIATED', 'RTP', 'CLEARED'
ALTER TABLE injury_records ADD COLUMN estimated_recovery_time VARCHAR(100) NULL AFTER current_status;
ALTER TABLE injury_records ADD COLUMN estimated_return_date DATE NULL AFTER estimated_recovery_time;
ALTER TABLE injury_records ADD COLUMN medical_clearance_given TINYINT(1) NOT NULL DEFAULT 0 AFTER estimated_return_date;

-- 3. File paths directly on the injury record
ALTER TABLE injury_records ADD COLUMN medical_report_path VARCHAR(500) NULL AFTER medical_clearance_given;
ALTER TABLE injury_records ADD COLUMN imaging_path VARCHAR(500) NULL AFTER medical_report_path;
ALTER TABLE injury_records ADD COLUMN clearance_path VARCHAR(500) NULL AFTER imaging_path;

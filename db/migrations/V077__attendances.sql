-- V077__attendances.sql - Attendance tracking for teams

CREATE TABLE IF NOT EXISTS attendances (
    id VARCHAR(20) NOT NULL PRIMARY KEY,
    team_id VARCHAR(20) NOT NULL,
    athlete_id VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'present', /* present, absent, injured */
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance (team_id, athlete_id, attendance_date),
    CONSTRAINT fk_attendance_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V017__crm_tasks.sql
-- Creates `tasks` and `task_logs` tables for CRM module

CREATE TABLE IF NOT EXISTS `tasks` (
  `id`          VARCHAR(20)   NOT NULL,
  `user_id`     VARCHAR(20)   NOT NULL COMMENT 'Creator',
  `title`       VARCHAR(255)  NOT NULL,
  `category`    VARCHAR(50)   NOT NULL DEFAULT 'Interno',
  `priority`    VARCHAR(20)   NOT NULL DEFAULT 'Media'  COMMENT 'Bassa | Media | Alta | Urgente',
  `status`      VARCHAR(30)   NOT NULL DEFAULT 'Da fare' COMMENT 'Da fare | In corso | Completato | Annullato',
  `due_date`    DATETIME      DEFAULT NULL,
  `notes`       TEXT          DEFAULT NULL,
  `assigned_to` VARCHAR(20)   DEFAULT NULL COMMENT 'FK → users.id',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_user`     (`user_id`),
  KEY `idx_tasks_status`   (`status`),
  KEY `idx_tasks_priority` (`priority`),
  KEY `idx_tasks_due`      (`due_date`),
  KEY `idx_tasks_assigned` (`assigned_to`),
  CONSTRAINT `fk_tasks_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `task_logs` (
  `id`               VARCHAR(20)  NOT NULL,
  `task_id`          VARCHAR(20)  NOT NULL,
  `user_id`          VARCHAR(20)  DEFAULT NULL COMMENT 'Who created this log entry',
  `interaction_date` DATETIME     NOT NULL,
  `notes`            TEXT         DEFAULT NULL,
  `outcome`          VARCHAR(50)  DEFAULT NULL COMMENT 'Positivo | Neutro | Negativo | In attesa',
  `schedule_followup` TINYINT(1)  NOT NULL DEFAULT 0,
  `followup_date`    DATETIME     DEFAULT NULL,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_logs_task` (`task_id`),
  KEY `idx_task_logs_user` (`user_id`),
  CONSTRAINT `fk_task_logs_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

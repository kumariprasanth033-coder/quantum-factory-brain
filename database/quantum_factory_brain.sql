-- ============================================================
-- QUANTUM FACTORY BRAIN — DATABASE SCHEMA & SEED DATA
-- UC-058: Dynamic Flexible Job-Shop Scheduling (DFJSSP)
-- Compatibility: MySQL 8.0+ / MariaDB 10.5+ / XAMPP phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS `quantum_factory_brain` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quantum_factory_brain`;

-- Disable foreign key checks for clean recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `factory_settings`;
DROP TABLE IF EXISTS `alerts`;
DROP TABLE IF EXISTS `optimization_runs`;
DROP TABLE IF EXISTS `schedule_operations`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `operation_machines`;
DROP TABLE IF EXISTS `job_operations`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `machine_availability`;
DROP TABLE IF EXISTS `machines`;
DROP TABLE IF EXISTS `user_factories`;
DROP TABLE IF EXISTS `factories`;
DROP TABLE IF EXISTS `users`;

-- ------------------------------------------------------------
-- 1. FACTORIES TABLE (Multi-Tenant & Company Separation)
-- ------------------------------------------------------------
CREATE TABLE `factories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `factory_code` VARCHAR(50) NOT NULL UNIQUE,
  `factory_name` VARCHAR(150) NOT NULL,
  `industry` VARCHAR(100) DEFAULT 'Aerospace & Precision Manufacturing',
  `location` VARCHAR(150) DEFAULT 'Amaravati Quantum Valley',
  `contact_email` VARCHAR(150) DEFAULT 'ops@quantumfactory.local',
  `working_hours` VARCHAR(50) DEFAULT '08:00 - 20:00 (Two 8h Shifts)',
  `time_zone` VARCHAR(50) DEFAULT 'UTC+05:30 (IST)',
  `is_demo` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_factories_demo` (`is_demo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. USERS TABLE
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `factory_id` INT UNSIGNED DEFAULT 1,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'manager', 'operator') NOT NULL DEFAULT 'manager',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`),
  CONSTRAINT `fk_users_factory` FOREIGN KEY (`factory_id`) REFERENCES `factories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. MACHINES TABLE
-- ------------------------------------------------------------
CREATE TABLE `machines` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `machine_code` VARCHAR(20) NOT NULL UNIQUE,
  `machine_name` VARCHAR(100) NOT NULL,
  `machine_type` VARCHAR(50) NOT NULL,
  `status` ENUM('AVAILABLE', 'BUSY', 'MAINTENANCE', 'OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
  `capacity` INT UNSIGNED NOT NULL DEFAULT 1,
  `location` VARCHAR(100) DEFAULT 'Main Shop Floor',
  `available_from` TIME DEFAULT '08:00:00',
  `available_until` TIME DEFAULT '20:00:00',
  `maintenance_status` VARCHAR(255) DEFAULT 'Nominal operating condition',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_machines_status` (`status`),
  INDEX `idx_machines_code` (`machine_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. MACHINE AVAILABILITY & CALENDAR
-- ------------------------------------------------------------
CREATE TABLE `machine_availability` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `machine_id` INT UNSIGNED NOT NULL,
  `day_of_week` TINYINT NOT NULL COMMENT '1=Mon, 7=Sun',
  `start_time` TIME NOT NULL DEFAULT '08:00:00',
  `end_time` TIME NOT NULL DEFAULT '20:00:00',
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT `fk_availability_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. JOBS / ORDERS TABLE
-- ------------------------------------------------------------
CREATE TABLE `jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_number` VARCHAR(30) NOT NULL UNIQUE,
  `customer_name` VARCHAR(120) NOT NULL,
  `product_name` VARCHAR(120) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `arrival_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATETIME NOT NULL,
  `status` ENUM('WAITING', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'DELAYED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
  `estimated_processing_time` DECIMAL(8,2) DEFAULT 0.00 COMMENT 'hours',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_jobs_priority` (`priority`),
  INDEX `idx_jobs_status` (`status`),
  INDEX `idx_jobs_due` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. JOB OPERATIONS TABLE (Precedence & Operations)
-- ------------------------------------------------------------
CREATE TABLE `job_operations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT UNSIGNED NOT NULL,
  `operation_number` VARCHAR(30) NOT NULL,
  `operation_name` VARCHAR(100) NOT NULL,
  `processing_time` DECIMAL(6,2) NOT NULL COMMENT 'base hours',
  `sequence_number` INT UNSIGNED NOT NULL DEFAULT 1,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'DELAYED') NOT NULL DEFAULT 'PENDING',
  CONSTRAINT `fk_operations_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_job_sequence` (`job_id`, `sequence_number`),
  INDEX `idx_operations_job` (`job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. OPERATION MACHINE ELIGIBILITY & PROCESSING TIMES (DFJSSP)
-- ------------------------------------------------------------
CREATE TABLE `operation_machines` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `operation_id` INT UNSIGNED NOT NULL,
  `machine_id` INT UNSIGNED NOT NULL,
  `processing_time` DECIMAL(6,2) NOT NULL COMMENT 'hours on this machine',
  `is_preferred` BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT `fk_op_machine_operation` FOREIGN KEY (`operation_id`) REFERENCES `job_operations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_op_machine_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_op_machine` (`operation_id`, `machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. SCHEDULES TABLE
-- ------------------------------------------------------------
CREATE TABLE `schedules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(20) NOT NULL,
  `mode` ENUM('classical', 'quantum_inspired', 'hybrid') NOT NULL DEFAULT 'quantum_inspired',
  `makespan` DECIMAL(8,2) NOT NULL COMMENT 'hours',
  `utilization` DECIMAL(5,2) NOT NULL COMMENT 'percent',
  `idle_time` DECIMAL(8,2) NOT NULL COMMENT 'total idle hours',
  `delayed_jobs` INT UNSIGNED NOT NULL DEFAULT 0,
  `objective_weights` JSON DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_schedules_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8. SCHEDULE OPERATIONS (Allocated time blocks)
-- ------------------------------------------------------------
CREATE TABLE `schedule_operations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT UNSIGNED NOT NULL,
  `job_id` INT UNSIGNED NOT NULL,
  `operation_id` INT UNSIGNED NOT NULL,
  `machine_id` INT UNSIGNED NOT NULL,
  `start_time` DECIMAL(8,2) NOT NULL COMMENT 'relative hours from 0.0',
  `end_time` DECIMAL(8,2) NOT NULL COMMENT 'relative hours from 0.0',
  `duration` DECIMAL(6,2) NOT NULL,
  `status` ENUM('SCHEDULED', 'ACTIVE', 'DONE', 'DELAYED') NOT NULL DEFAULT 'SCHEDULED',
  `delay` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_sched_op_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sched_op_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sched_op_operation` FOREIGN KEY (`operation_id`) REFERENCES `job_operations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sched_op_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
  INDEX `idx_sched_op_sched` (`schedule_id`),
  INDEX `idx_sched_op_machine` (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 9. OPTIMIZATION RUNS BENCHMARK & AUDIT
-- ------------------------------------------------------------
CREATE TABLE `optimization_runs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT UNSIGNED DEFAULT NULL,
  `mode` VARCHAR(50) NOT NULL,
  `problem_size_jobs` INT NOT NULL,
  `problem_size_ops` INT NOT NULL,
  `problem_size_machines` INT NOT NULL,
  `constraints_count` INT NOT NULL,
  `execution_time_ms` INT NOT NULL,
  `initial_makespan` DECIMAL(8,2) NOT NULL,
  `optimized_makespan` DECIMAL(8,2) NOT NULL,
  `improvement_pct` DECIMAL(5,2) NOT NULL,
  `solver_details` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 10. ALERTS TABLE
-- ------------------------------------------------------------
CREATE TABLE `alerts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `severity` ENUM('info', 'warning', 'danger', 'success') NOT NULL DEFAULT 'info',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alerts_read` (`is_read`),
  INDEX `idx_alerts_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 11. FACTORY SETTINGS
-- ------------------------------------------------------------
CREATE TABLE `factory_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(60) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 12. AUDIT LOGS
-- ------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- Default Passwords: "password123"
-- Hashed via PHP password_hash('password123', PASSWORD_BCRYPT)
-- ============================================================

INSERT INTO `factories` (`id`, `factory_code`, `factory_name`, `industry`, `location`, `contact_email`, `is_demo`) VALUES
(1, 'DEMO-DFJSSP-01', 'Amaravati Quantum Valley Digital Foundry (Demo)', 'Aerospace & Precision Manufacturing', 'Amaravati Quantum Valley, AP', 'ops@quantumfactory.local', TRUE),
(2, 'PROD-PLANT-01', 'Custom Flexible Production Bay', 'Industrial Robotics & Precision Automation', 'Industrial Zone Bay 4', 'manager@quantumfactory.local', FALSE);

INSERT INTO `users` (`id`, `factory_id`, `name`, `email`, `password`, `role`, `status`) VALUES
(1, 1, 'System Administrator', 'admin@quantumfactory.local', '$2y$10$wN1QyZ6kG0R3wB7Yl8H4uOYQd3dF5mR0Y.c0dZ1L8l9B0r0p1M0uG', 'admin', 'active'),
(2, 1, 'Chief Production Manager', 'manager@quantumfactory.local', '$2y$10$wN1QyZ6kG0R3wB7Yl8H4uOYQd3dF5mR0Y.c0dZ1L8l9B0r0p1M0uG', 'manager', 'active'),
(3, 1, 'System Administrator (Alias)', 'admin@qfactory.local', '$2y$10$wN1QyZ6kG0R3wB7Yl8H4uOYQd3dF5mR0Y.c0dZ1L8l9B0r0p1M0uG', 'admin', 'active'),
(4, 1, 'Chief Production Manager (Alias)', 'manager@qfactory.local', '$2y$10$wN1QyZ6kG0R3wB7Yl8H4uOYQd3dF5mR0Y.c0dZ1L8l9B0r0p1M0uG', 'manager', 'active'),
(5, 1, 'Lead Machine Operator', 'operator@qfactory.local', '$2y$10$wN1QyZ6kG0R3wB7Yl8H4uOYQd3dF5mR0Y.c0dZ1L8l9B0r0p1M0uG', 'operator', 'active');

-- 6 Flexible Manufacturing Machines
INSERT INTO `machines` (`id`, `machine_code`, `machine_name`, `machine_type`, `status`, `capacity`, `location`, `maintenance_status`) VALUES
(1, 'M01', 'CNC Milling Center Alpha', '5-Axis CNC Mill', 'AVAILABLE', 1, 'Bay 1 - Heavy Machining', 'Nominal - Calibration valid'),
(2, 'M02', 'High-Precision Lathe Beta', 'CNC Lathe & Turning', 'AVAILABLE', 1, 'Bay 1 - Heavy Machining', 'Nominal - Tooling inspected'),
(3, 'M03', 'Multi-Axis Robotic Welder', 'Robotic TIG/MIG Welder', 'AVAILABLE', 1, 'Bay 2 - Fabrication', 'Nominal - Gas pressure optimal'),
(4, 'M04', 'Direct Metal Laser Sinter 3D', 'Additive Manufacturing', 'AVAILABLE', 1, 'Bay 2 - Fabrication', 'Nominal - Chamber preheated'),
(5, 'M05', 'Electrostatic Coating & Cure', 'Finishing & Painting', 'AVAILABLE', 1, 'Bay 3 - Finishing', 'Nominal - Ventilation active'),
(6, 'M06', 'Automated CMM & Final QA', 'Inspection & Packaging', 'AVAILABLE', 1, 'Bay 4 - Quality Assurance', 'Nominal - Optical sensors calibrated');

-- Factory Default Settings
INSERT INTO `factory_settings` (`setting_key`, `setting_value`) VALUES
('factory_name', 'Amaravati Quantum Valley Digital Foundry'),
('scheduling_mode', 'quantum_inspired'),
('weight_makespan', '0.40'),
('weight_delay', '0.30'),
('weight_idle', '0.20'),
('weight_bottleneck', '0.10'),
('shift_hours', '16'),
('sim_time_hours', '4.5');

-- Initial Alerts
INSERT INTO `alerts` (`type`, `title`, `message`, `severity`, `is_read`) VALUES
('system', 'Quantum Engine Initialized', 'DFJSSP Quantum-Inspired optimization model compiled with 6 machines and 20 sample job orders.', 'info', 0),
('warning', 'High Utilization on M01', 'CNC Milling Center Alpha is nearing 92% capacity under baseline FIFO scheduling.', 'warning', 0),
('info', 'XAMPP & Apache Ready', 'PHP REST APIs active. MySQL connectivity established with prepared PDO queries.', 'success', 0);

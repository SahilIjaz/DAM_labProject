-- Distributed University Management System - MySQL Schema
-- Primary Database: university_main
-- Server: Lahore (Master)

CREATE DATABASE IF NOT EXISTS university_main;
USE university_main;

-- ============================================================================
-- CORE TABLES FOR TRANSACTIONAL DATA
-- ============================================================================

-- ROLES Table
CREATE TABLE IF NOT EXISTS roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PERMISSIONS Table
CREATE TABLE IF NOT EXISTS permissions (
  permission_id INT PRIMARY KEY AUTO_INCREMENT,
  permission_name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ROLE_PERMISSIONS Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CAMPUSES Table
CREATE TABLE IF NOT EXISTS campuses (
  campus_id INT PRIMARY KEY AUTO_INCREMENT,
  campus_name VARCHAR(150) UNIQUE NOT NULL,
  location VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  server_ip VARCHAR(15),
  replication_type ENUM('master', 'slave', 'distributed') DEFAULT 'master',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DEPARTMENTS Table
CREATE TABLE IF NOT EXISTS departments (
  department_id INT PRIMARY KEY AUTO_INCREMENT,
  dept_name VARCHAR(150) UNIQUE NOT NULL,
  dept_code VARCHAR(10) UNIQUE NOT NULL,
  campus_id INT NOT NULL,
  head_of_dept INT,
  budget DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campus_id) REFERENCES campuses(campus_id),
  INDEX idx_campus_id (campus_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INT NOT NULL,
  department_id INT,
  campus_id INT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (role_id) REFERENCES roles(role_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (campus_id) REFERENCES campuses(campus_id),
  INDEX idx_email (email),
  INDEX idx_role_id (role_id),
  INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update departments head_of_dept foreign key
ALTER TABLE departments
  ADD FOREIGN KEY (head_of_dept) REFERENCES users(user_id) ON DELETE SET NULL;

-- STUDENTS Table
CREATE TABLE IF NOT EXISTS students (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id VARCHAR(50) UNIQUE,
  user_id INT NOT NULL,
  department_id INT NOT NULL,
  enrollment_date DATE,
  current_semester INT DEFAULT 1,
  gpa DECIMAL(3,2) DEFAULT 0.00,
  status ENUM('active', 'graduated', 'suspended', 'dropped') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  INDEX idx_user_id (user_id),
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FACULTY Table
CREATE TABLE IF NOT EXISTS faculty (
  faculty_id INT PRIMARY KEY AUTO_INCREMENT,
  faculty_code VARCHAR(50) UNIQUE,
  user_id INT NOT NULL,
  department_id INT NOT NULL,
  qualification VARCHAR(255),
  specialization VARCHAR(255),
  hiring_date DATE,
  status ENUM('active', 'on-leave', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  INDEX idx_user_id (user_id),
  INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- COURSES Table
CREATE TABLE IF NOT EXISTS courses (
  course_id INT PRIMARY KEY AUTO_INCREMENT,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(150) NOT NULL,
  department_id INT NOT NULL,
  faculty_id INT,
  credit_hours INT DEFAULT 3,
  capacity INT DEFAULT 50,
  semester INT DEFAULT 1,
  syllabus LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
  INDEX idx_department_id (department_id),
  INDEX idx_faculty_id (faculty_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ENROLLMENTS Table
CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  semester INT NOT NULL,
  enrollment_date DATE,
  status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
  grade VARCHAR(2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  UNIQUE KEY unique_enrollment (student_id, course_id, semester),
  INDEX idx_student_id (student_id),
  INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- EXAM_RESULTS Table
CREATE TABLE IF NOT EXISTS exam_results (
  result_id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  exam_type ENUM('midterm', 'final', 'quiz') DEFAULT 'final',
  marks_obtained INT,
  total_marks INT DEFAULT 100,
  percentage DECIMAL(5,2),
  exam_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_exam_type (exam_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ID Sequences Table for generating sequential IDs
CREATE TABLE IF NOT EXISTS id_sequences (
  sequence_name VARCHAR(100) PRIMARY KEY,
  current_value INT DEFAULT 0,
  prefix VARCHAR(50),
  suffix VARCHAR(50),
  increment INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO id_sequences VALUES
('student_seq', 0, 'BULC_IT_F21_', '', 1),
('faculty_seq', 0, 'FAC_', '', 1);

-- Audit Logs Table (Temporary, synced to PostgreSQL)
CREATE TABLE IF NOT EXISTS audit_logs_temp (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(255),
  table_name VARCHAR(100),
  record_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_ms INT,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert Roles
INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
(1, 'Super Admin', 'Full system access'),
(2, 'Database Administrator', 'Database management'),
(3, 'System Administrator', 'System management'),
(4, 'Faculty', 'Course management'),
(5, 'Department Head', 'Department management'),
(6, 'Instructor', 'Teach courses'),
(7, 'Student', 'Limited access'),
(8, 'Support Staff', 'Administrative tasks'),
(9, 'Data Entry Operator', 'Data entry'),
(10, 'Guest', 'Read-only');

-- Insert Permissions
INSERT IGNORE INTO permissions (permission_id, permission_name, resource, action, description) VALUES
(1, 'users_create', 'users', 'create', 'Create users'),
(2, 'users_read', 'users', 'read', 'Read users'),
(3, 'users_update', 'users', 'update', 'Update users'),
(4, 'users_delete', 'users', 'delete', 'Delete users'),
(5, 'students_create', 'students', 'create', 'Create students'),
(6, 'students_read', 'students', 'read', 'Read students'),
(7, 'students_update', 'students', 'update', 'Update students'),
(8, 'students_delete', 'students', 'delete', 'Delete students'),
(9, 'courses_create', 'courses', 'create', 'Create courses'),
(10, 'courses_read', 'courses', 'read', 'Read courses'),
(11, 'courses_update', 'courses', 'update', 'Update courses'),
(12, 'courses_delete', 'courses', 'delete', 'Delete courses'),
(13, 'exams_create', 'exams', 'create', 'Create exams'),
(14, 'exams_read', 'exams', 'read', 'Read exams'),
(15, 'exams_update', 'exams', 'update', 'Update exams'),
(16, 'reports_generate', 'reports', 'create', 'Generate reports'),
(17, 'admin_access', 'admin', 'manage', 'Admin panel access'),
(18, 'backup_manage', 'backup', 'manage', 'Manage backups');

-- Insert Campuses
INSERT IGNORE INTO campuses (campus_id, campus_name, location, city, country, server_ip, replication_type) VALUES
(1, 'Main Campus - Lahore', '123 University Road', 'Lahore', 'Pakistan', '192.168.1.10', 'master'),
(2, 'Islamabad Campus', '456 Education Street', 'Islamabad', 'Pakistan', '192.168.1.20', 'slave'),
(3, 'Karachi Campus', '789 College Avenue', 'Karachi', 'Pakistan', '192.168.1.30', 'slave');

-- Insert Departments
INSERT IGNORE INTO departments (department_id, dept_name, dept_code, campus_id, budget, created_at) VALUES
(1, 'Computer Science', 'CS', 1, 500000.00, NOW()),
(2, 'Business Administration', 'BA', 1, 400000.00, NOW()),
(3, 'Engineering', 'ENG', 1, 600000.00, NOW()),
(4, 'Information Technology', 'IT', 2, 450000.00, NOW()),
(5, 'Science', 'SCI', 3, 350000.00, NOW());

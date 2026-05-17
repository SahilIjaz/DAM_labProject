-- Triggers for University Management System - MySQL

USE university_main;

-- ============================================================================
-- TRG1: Audit Student Inserts
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_student_insert
AFTER INSERT ON students FOR EACH ROW
BEGIN
    INSERT INTO audit_logs_temp
    (user_id, action, table_name, record_id, new_value, timestamp)
    VALUES
    (IFNULL((SELECT user_id FROM users WHERE username = CURRENT_USER()), 0), 'INSERT', 'students', NEW.student_id,
     JSON_OBJECT('enrollment_id', NEW.enrollment_id, 'user_id', NEW.user_id), NOW());
END$$
DELIMITER ;

-- ============================================================================
-- TRG2: Audit Exam Results Updates
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_exam_result_update
AFTER UPDATE ON exam_results FOR EACH ROW
BEGIN
    IF OLD.marks_obtained != NEW.marks_obtained OR OLD.percentage != NEW.percentage THEN
        INSERT INTO audit_logs_temp
        (user_id, action, table_name, record_id, old_value, new_value, timestamp)
        VALUES
        (IFNULL((SELECT user_id FROM users WHERE username = CURRENT_USER()), 0), 'UPDATE', 'exam_results', NEW.result_id,
         JSON_OBJECT('marks', OLD.marks_obtained, 'percentage', OLD.percentage),
         JSON_OBJECT('marks', NEW.marks_obtained, 'percentage', NEW.percentage),
         NOW());
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- TRG3: Audit Course Deletions
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_course_delete
BEFORE DELETE ON courses FOR EACH ROW
BEGIN
    INSERT INTO audit_logs_temp
    (user_id, action, table_name, record_id, old_value, timestamp)
    VALUES
    (IFNULL((SELECT user_id FROM users WHERE username = CURRENT_USER()), 0), 'DELETE', 'courses', OLD.course_id,
     JSON_OBJECT('course_name', OLD.course_name, 'course_code', OLD.course_code),
     NOW());
END$$
DELIMITER ;

-- ============================================================================
-- TRG4: Update Enrollment Status on Course Completion
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_enrollment_completion
AFTER UPDATE ON enrollments FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE exam_results
        SET created_at = NOW()
        WHERE enrollment_id = NEW.enrollment_id;
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- TRG5: Prevent Over-enrollment
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_prevent_over_enrollment
BEFORE INSERT ON enrollments FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_enrolled INT;

    SELECT capacity INTO v_capacity FROM courses WHERE course_id = NEW.course_id;
    SELECT COUNT(*) INTO v_enrolled FROM enrollments
    WHERE course_id = NEW.course_id AND semester = NEW.semester AND status = 'enrolled';

    IF v_enrolled >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course capacity exceeded';
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- TRG6: Auto-update User timestamp
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_user_update_timestamp
BEFORE UPDATE ON users FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- ============================================================================
-- TRG7: Auto-update Students timestamp
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_student_update_timestamp
BEFORE UPDATE ON students FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- ============================================================================
-- TRG8: Audit User Status Changes
-- ============================================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_user_status_change
AFTER UPDATE ON users FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_logs_temp
        (user_id, action, table_name, record_id, old_value, new_value, timestamp)
        VALUES
        (NEW.user_id, 'STATUS_CHANGE', 'users', NEW.user_id,
         JSON_OBJECT('status', OLD.status),
         JSON_OBJECT('status', NEW.status),
         NOW());
    END IF;
END$$
DELIMITER ;



USE university_main;

CREATE TABLE IF NOT EXISTS cache_invalidation_queue (
    queue_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    event_type ENUM('delete', 'invalidate') DEFAULT 'delete',
    table_name VARCHAR(100),
    record_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_users_insert
AFTER INSERT ON users FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('users:*'), 'invalidate', 'users', NEW.user_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('user:', NEW.user_id), 'delete', 'users', NEW.user_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('user:email:', NEW.email), 'delete', 'users', NEW.user_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_users_update
AFTER UPDATE ON users FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('user:', NEW.user_id), 'delete', 'users', NEW.user_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('users:*'), 'invalidate', 'users', NEW.user_id);


    IF OLD.email != NEW.email THEN
        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('user:email:', OLD.email), 'delete', 'users', NEW.user_id);

        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('user:email:', NEW.email), 'delete', 'users', NEW.user_id);
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_users_delete
AFTER DELETE ON users FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('user:', OLD.user_id), 'delete', 'users', OLD.user_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('user:email:', OLD.email), 'delete', 'users', OLD.user_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('users:*'), 'invalidate', 'users', OLD.user_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_students_insert
AFTER INSERT ON students FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('student:', NEW.student_id), 'delete', 'students', NEW.student_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('students:*'), 'invalidate', 'students', NEW.student_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('student:enrollment:', NEW.enrollment_id), 'delete', 'students', NEW.student_id);


    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('department:', NEW.department_id, ':students'), 'delete', 'students', NEW.student_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_students_update
AFTER UPDATE ON students FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('student:', NEW.student_id), 'delete', 'students', NEW.student_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('students:*'), 'invalidate', 'students', NEW.student_id);


    IF OLD.gpa != NEW.gpa THEN
        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('analytics:student:', NEW.student_id), 'delete', 'students', NEW.student_id);
    END IF;


    IF OLD.department_id != NEW.department_id THEN
        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('department:', OLD.department_id, ':students'), 'delete', 'students', NEW.student_id);

        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('department:', NEW.department_id, ':students'), 'delete', 'students', NEW.student_id);
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_students_delete
AFTER DELETE ON students FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('student:', OLD.student_id), 'delete', 'students', OLD.student_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('students:*'), 'invalidate', 'students', OLD.student_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('department:', OLD.department_id, ':students'), 'delete', 'students', OLD.student_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_courses_insert
AFTER INSERT ON courses FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:', NEW.course_id), 'delete', 'courses', NEW.course_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('courses:*'), 'invalidate', 'courses', NEW.course_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:code:', NEW.course_code), 'delete', 'courses', NEW.course_id);


    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('department:', NEW.department_id, ':courses'), 'delete', 'courses', NEW.course_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_courses_update
AFTER UPDATE ON courses FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:', NEW.course_id), 'delete', 'courses', NEW.course_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('courses:*'), 'invalidate', 'courses', NEW.course_id);


    IF OLD.capacity != NEW.capacity THEN
        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('course:capacity:', NEW.course_id), 'delete', 'courses', NEW.course_id);
    END IF;


    IF OLD.faculty_id != NEW.faculty_id THEN
        IF OLD.faculty_id IS NOT NULL THEN
            INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
            VALUES (CONCAT('faculty:', OLD.faculty_id, ':courses'), 'delete', 'courses', NEW.course_id);
        END IF;
        IF NEW.faculty_id IS NOT NULL THEN
            INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
            VALUES (CONCAT('faculty:', NEW.faculty_id, ':courses'), 'delete', 'courses', NEW.course_id);
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_courses_delete
AFTER DELETE ON courses FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:', OLD.course_id), 'delete', 'courses', OLD.course_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:code:', OLD.course_code), 'delete', 'courses', OLD.course_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('courses:*'), 'invalidate', 'courses', OLD.course_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('department:', OLD.department_id, ':courses'), 'delete', 'courses', OLD.course_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_enrollments_insert
AFTER INSERT ON enrollments FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollment:', NEW.enrollment_id), 'delete', 'enrollments', NEW.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('student:', NEW.student_id, ':enrollments'), 'delete', 'enrollments', NEW.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:', NEW.course_id, ':enrollments'), 'delete', 'enrollments', NEW.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollments:*'), 'invalidate', 'enrollments', NEW.enrollment_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_enrollments_update
AFTER UPDATE ON enrollments FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollment:', NEW.enrollment_id), 'delete', 'enrollments', NEW.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollments:*'), 'invalidate', 'enrollments', NEW.enrollment_id);


    IF OLD.status != NEW.status THEN
        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('student:', NEW.student_id, ':enrollments'), 'delete', 'enrollments', NEW.enrollment_id);

        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('course:', NEW.course_id, ':enrollments'), 'delete', 'enrollments', NEW.enrollment_id);
    END IF;


    IF OLD.grade != NEW.grade THEN
        INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
        VALUES (CONCAT('student:', NEW.student_id, ':gpa'), 'delete', 'enrollments', NEW.enrollment_id);
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_enrollments_delete
AFTER DELETE ON enrollments FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollment:', OLD.enrollment_id), 'delete', 'enrollments', OLD.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('student:', OLD.student_id, ':enrollments'), 'delete', 'enrollments', OLD.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('course:', OLD.course_id, ':enrollments'), 'delete', 'enrollments', OLD.enrollment_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollments:*'), 'invalidate', 'enrollments', OLD.enrollment_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_exam_results_insert
AFTER INSERT ON exam_results FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('exam_result:', NEW.result_id), 'delete', 'exam_results', NEW.result_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollment:', NEW.enrollment_id, ':results'), 'delete', 'exam_results', NEW.result_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('exam_results:*'), 'invalidate', 'exam_results', NEW.result_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_exam_results_update
AFTER UPDATE ON exam_results FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('exam_result:', NEW.result_id), 'delete', 'exam_results', NEW.result_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollment:', NEW.enrollment_id, ':results'), 'delete', 'exam_results', NEW.result_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('exam_results:*'), 'invalidate', 'exam_results', NEW.result_id);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_exam_results_delete
AFTER DELETE ON exam_results FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('exam_result:', OLD.result_id), 'delete', 'exam_results', OLD.result_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('enrollment:', OLD.enrollment_id, ':results'), 'delete', 'exam_results', OLD.result_id);

    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('exam_results:*'), 'invalidate', 'exam_results', OLD.result_id);
END$$
DELIMITER ;

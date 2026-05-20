

USE university_main;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_create_user(
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_role_id INT,
    IN p_department_id INT,
    IN p_campus_id INT,
    OUT p_user_id INT,
    OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @p1 = MESSAGE_TEXT;
        SET p_error_message = CONCAT('Error creating user: ', @p1);
        SET p_user_id = -1;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        SET p_error_message = 'Email already exists';
        SET p_user_id = -1;
        ROLLBACK;
    ELSE
        INSERT INTO users (username, email, password_hash, first_name, last_name,
                          role_id, department_id, campus_id, status, created_at)
        VALUES (p_username, p_email, p_password_hash, p_first_name, p_last_name,
                p_role_id, p_department_id, p_campus_id, 'active', NOW());

        SET p_user_id = LAST_INSERT_ID();
        SET p_error_message = 'User created successfully';
        COMMIT;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_enroll_student(
    IN p_student_id INT,
    IN p_course_id INT,
    IN p_semester INT,
    OUT p_enrollment_id INT,
    OUT p_status VARCHAR(100)
)
BEGIN
    DECLARE v_course_capacity INT;
    DECLARE v_enrolled_count INT;
    DECLARE v_student_exists INT;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_student_exists FROM students WHERE student_id = p_student_id;

    IF v_student_exists = 0 THEN
        ROLLBACK;
        SET p_status = 'Student not found';
        SET p_enrollment_id = -1;
    ELSE
        SELECT capacity INTO v_course_capacity FROM courses WHERE course_id = p_course_id;

        SELECT COUNT(*) INTO v_enrolled_count
        FROM enrollments
        WHERE course_id = p_course_id AND semester = p_semester AND status = 'enrolled';

        IF v_enrolled_count >= v_course_capacity THEN
            ROLLBACK;
            SET p_status = 'Course is full';
            SET p_enrollment_id = -1;
        ELSE
            INSERT INTO enrollments (student_id, course_id, semester, enrollment_date, status)
            VALUES (p_student_id, p_course_id, p_semester, CURDATE(), 'enrolled');

            SET p_enrollment_id = LAST_INSERT_ID();
            SET p_status = 'Enrollment successful';
            COMMIT;
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_validate_credentials(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    OUT p_user_id INT,
    OUT p_role_id INT,
    OUT p_is_valid BOOLEAN
)
BEGIN
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_user_exists INT;

    SELECT COUNT(*) INTO v_user_exists FROM users
    WHERE email = p_email AND status = 'active';

    IF v_user_exists = 0 THEN
        SET p_is_valid = FALSE;
        SET p_user_id = -1;
        SET p_role_id = -1;
    ELSE
        SELECT user_id, role_id, password_hash INTO p_user_id, p_role_id, v_password_hash
        FROM users
        WHERE email = p_email AND status = 'active';

        SET p_is_valid = (v_password_hash = p_password_hash);

        IF p_is_valid THEN
            UPDATE users SET last_login = NOW() WHERE user_id = p_user_id;
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_update_exam_result(
    IN p_enrollment_id INT,
    IN p_exam_type VARCHAR(50),
    IN p_marks_obtained INT,
    IN p_total_marks INT,
    OUT p_grade VARCHAR(2),
    OUT p_result_id INT
)
BEGIN
    DECLARE v_percentage DECIMAL(5,2);
    DECLARE v_student_id INT;

    START TRANSACTION;

    SET v_percentage = (p_marks_obtained / p_total_marks) * 100;

    CASE
        WHEN v_percentage >= 90 THEN SET p_grade = 'A';
        WHEN v_percentage >= 80 THEN SET p_grade = 'B';
        WHEN v_percentage >= 70 THEN SET p_grade = 'C';
        WHEN v_percentage >= 60 THEN SET p_grade = 'D';
        ELSE SET p_grade = 'F';
    END CASE;

    INSERT INTO exam_results
    (enrollment_id, exam_type, marks_obtained, total_marks, percentage, exam_date)
    VALUES (p_enrollment_id, p_exam_type, p_marks_obtained, p_total_marks, v_percentage, CURDATE());

    SET p_result_id = LAST_INSERT_ID();

    SELECT student_id INTO v_student_id FROM enrollments WHERE enrollment_id = p_enrollment_id;

    UPDATE students
    SET gpa = (
        SELECT AVG(percentage) / 20 FROM exam_results
        WHERE enrollment_id IN (
            SELECT enrollment_id FROM enrollments
            WHERE student_id = v_student_id
        )
    )
    WHERE student_id = v_student_id;

    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_delete_student(
    IN p_student_id INT,
    OUT p_delete_status VARCHAR(100)
)
BEGIN
    DECLARE v_enrollment_count INT;
    DECLARE v_user_id INT;

    START TRANSACTION;

    SELECT user_id INTO v_user_id FROM students WHERE student_id = p_student_id;

    SELECT COUNT(*) INTO v_enrollment_count
    FROM enrollments
    WHERE student_id = p_student_id AND status = 'enrolled';

    IF v_enrollment_count > 0 THEN
        ROLLBACK;
        SET p_delete_status = 'Cannot delete: Student has active enrollments';
    ELSE
        DELETE FROM enrollments WHERE student_id = p_student_id;

        DELETE FROM exam_results
        WHERE enrollment_id NOT IN (SELECT enrollment_id FROM enrollments);

        DELETE FROM students WHERE student_id = p_student_id;
        DELETE FROM users WHERE user_id = v_user_id;

        SET p_delete_status = 'Student deleted successfully';
        COMMIT;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_generate_enrollment_id(
    OUT p_enrollment_id VARCHAR(50)
)
BEGIN
    DECLARE v_current_value INT;

    START TRANSACTION;

    SELECT current_value INTO v_current_value
    FROM id_sequences
    WHERE sequence_name = 'student_seq'
    FOR UPDATE;

    SET v_current_value = v_current_value + 1;

    UPDATE id_sequences
    SET current_value = v_current_value
    WHERE sequence_name = 'student_seq';

    SET p_enrollment_id = CONCAT('BULC_IT_F21_', LPAD(v_current_value, 4, '0'));

    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_bulk_update_grades(
    IN p_semester INT
)
BEGIN
    DECLARE v_done INT;
    DECLARE v_enrollment_id INT;
    DECLARE v_marks INT;
    DECLARE v_total_marks INT;
    DECLARE v_grade VARCHAR(2);
    DECLARE enrollment_cursor CURSOR FOR
        SELECT e.enrollment_id
        FROM enrollments e
        WHERE e.semester = p_semester AND e.status = 'enrolled'
        ORDER BY e.enrollment_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    SET v_done = 0, v_total_marks = 100;

    OPEN enrollment_cursor;

    read_loop: LOOP
        FETCH enrollment_cursor INTO v_enrollment_id;

        IF v_done THEN
            LEAVE read_loop;
        END IF;

        SET v_marks = FLOOR(RAND() * 100) + 1;

        CASE
            WHEN (v_marks / v_total_marks) >= 0.9 THEN SET v_grade = 'A';
            WHEN (v_marks / v_total_marks) >= 0.8 THEN SET v_grade = 'B';
            WHEN (v_marks / v_total_marks) >= 0.7 THEN SET v_grade = 'C';
            WHEN (v_marks / v_total_marks) >= 0.6 THEN SET v_grade = 'D';
            ELSE SET v_grade = 'F';
        END CASE;

        INSERT INTO exam_results (enrollment_id, exam_type, marks_obtained, total_marks, percentage, exam_date)
        VALUES (v_enrollment_id, 'final', v_marks, v_total_marks,
                (v_marks / v_total_marks) * 100, CURDATE());

    END LOOP;

    CLOSE enrollment_cursor;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_transfer_student(
    IN p_student_id INT,
    IN p_new_department_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_old_dept_id INT;
    DECLARE v_user_id INT;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM departments WHERE department_id = p_new_department_id) THEN
        SET p_success = FALSE;
        SET p_message = 'Department not found';
        ROLLBACK;
    ELSE
        SELECT department_id, user_id INTO v_old_dept_id, v_user_id FROM students WHERE student_id = p_student_id;

        UPDATE students SET department_id = p_new_department_id WHERE student_id = p_student_id;
        UPDATE users SET department_id = p_new_department_id WHERE user_id = v_user_id;

        INSERT INTO audit_logs_temp (user_id, action, table_name, record_id, old_value, new_value, timestamp)
        VALUES (CURRENT_USER(), 'TRANSFER', 'students', p_student_id,
                CONCAT('Dept: ', v_old_dept_id), CONCAT('Dept: ', p_new_department_id), NOW());

        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Student transferred successfully';
    END IF;
END$$
DELIMITER ;

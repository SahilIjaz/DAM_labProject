-- Analytics Views for Dashboard
-- These views pre-compute aggregated data to improve query performance

USE university_main;

-- View 1: System Health Stats
DROP VIEW IF EXISTS v_system_health_stats;
CREATE VIEW v_system_health_stats AS
SELECT
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM faculty) as total_faculty,
  (SELECT COUNT(*) FROM enrollments) as total_enrollments;

-- View 2: Course Enrollment Analytics
DROP VIEW IF EXISTS v_course_enrollment_analytics;
CREATE VIEW v_course_enrollment_analytics AS
SELECT
  c.course_id,
  c.course_name,
  COUNT(e.enrollment_id) as total_enrolled,
  c.capacity,
  ROUND((COUNT(e.enrollment_id) / c.capacity * 100), 2) as capacity_used_percent
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name, c.capacity
ORDER BY total_enrolled DESC;

-- View 3: Student Performance Analytics
DROP VIEW IF EXISTS v_student_performance_analytics;
CREATE VIEW v_student_performance_analytics AS
SELECT
  u.first_name,
  u.last_name,
  s.student_id,
  e.enrollment_id,
  c.course_name,
  c.course_id,
  er.marks_obtained as obtained_marks,
  er.total_marks,
  er.percentage
FROM students s
JOIN users u ON s.user_id = u.user_id
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
ORDER BY u.last_name, c.course_name;

-- View 4: Faculty Workload Analytics
DROP VIEW IF EXISTS v_faculty_workload_analytics;
CREATE VIEW v_faculty_workload_analytics AS
SELECT
  f.faculty_id,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT c.course_id) as courses_assigned,
  COUNT(DISTINCT e.enrollment_id) as total_students
FROM faculty f
JOIN users u ON f.user_id = u.user_id
LEFT JOIN courses c ON f.faculty_id = c.faculty_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY f.faculty_id, u.first_name, u.last_name
ORDER BY courses_assigned DESC;

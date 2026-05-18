-- Create exams table for storing exam schedules
CREATE TABLE exams (
  exam_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  exam_name VARCHAR(255) NOT NULL,
  exam_date DATETIME NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  total_marks INT NOT NULL,
  passing_marks INT,
  exam_type VARCHAR(50) COMMENT 'midterm, final, quiz, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  INDEX idx_course_id (course_id),
  INDEX idx_exam_date (exam_date)
);

-- Insert sample exam data for testing
INSERT INTO exams (course_id, exam_name, exam_date, duration, total_marks, passing_marks, exam_type) VALUES
(1, 'Mathematics Midterm', '2026-06-05 10:00:00', 120, 100, 40, 'midterm'),
(1, 'Mathematics Final', '2026-07-20 14:00:00', 180, 100, 40, 'final'),
(2, 'Physics Quiz 1', '2026-06-10 09:00:00', 60, 50, 25, 'quiz'),
(2, 'Physics Midterm', '2026-06-25 10:00:00', 120, 100, 40, 'midterm'),
(3, 'Chemistry Final', '2026-07-22 15:00:00', 180, 100, 40, 'final'),
(4, 'English Composition', '2026-06-15 11:00:00', 120, 100, 40, 'final');

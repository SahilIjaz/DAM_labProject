import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// This endpoint should only be used during setup/initialization
export async function POST(request: NextRequest) {
  try {
    // Create exams table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS exams (
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
    `;

    await executeQuery(createTableQuery, []);

    // Get existing courses or create sample courses
    const coursesResult = await executeQuery('SELECT COUNT(*) as count FROM courses', []);
    const courseCount = (coursesResult[0] as any).count;

    if (courseCount === 0) {
      // Insert sample courses if they don't exist
      const insertCoursesQuery = `
        INSERT INTO courses (department_id, course_code, course_name, description, credits, semester, status)
        VALUES
        (1, 'MATH101', 'Calculus I', 'Introduction to Calculus', 3, 1, 'active'),
        (2, 'PHYS101', 'Physics I', 'Introduction to Physics', 4, 1, 'active'),
        (1, 'CHEM101', 'Chemistry I', 'Introduction to Chemistry', 3, 1, 'active'),
        (3, 'ENG101', 'English Composition', 'Academic Writing', 3, 1, 'active')
      `;
      await executeQuery(insertCoursesQuery, []);
    }

    // Insert sample exam data
    const insertDataQuery = `
      INSERT IGNORE INTO exams (exam_name, course_id, exam_date, duration, total_marks, passing_marks, exam_type)
      SELECT ?, course_id, ?, ?, ?, ?, ? FROM courses WHERE course_code = ?
      UNION ALL
      SELECT ?, course_id, ?, ?, ?, ?, ? FROM courses WHERE course_code = ?
      UNION ALL
      SELECT ?, course_id, ?, ?, ?, ?, ? FROM courses WHERE course_code = ?
      UNION ALL
      SELECT ?, course_id, ?, ?, ?, ?, ? FROM courses WHERE course_code = ?
      UNION ALL
      SELECT ?, course_id, ?, ?, ?, ?, ? FROM courses WHERE course_code = ?
      UNION ALL
      SELECT ?, course_id, ?, ?, ?, ?, ? FROM courses WHERE course_code = ?
    `;

    const examData = [
      'Mathematics Midterm', '2026-06-05 10:00:00', 120, 100, 40, 'midterm', 'MATH101',
      'Mathematics Final', '2026-07-20 14:00:00', 180, 100, 40, 'final', 'MATH101',
      'Physics Quiz 1', '2026-06-10 09:00:00', 60, 50, 25, 'quiz', 'PHYS101',
      'Physics Midterm', '2026-06-25 10:00:00', 120, 100, 40, 'midterm', 'PHYS101',
      'Chemistry Final', '2026-07-22 15:00:00', 180, 100, 40, 'final', 'CHEM101',
      'English Composition Test', '2026-06-15 11:00:00', 120, 100, 40, 'final', 'ENG101'
    ];

    await executeQuery(insertDataQuery, examData);

    return NextResponse.json({
      success: true,
      message: 'Tables created and sample data inserted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create tables' },
      { status: 500 }
    );
  }
}

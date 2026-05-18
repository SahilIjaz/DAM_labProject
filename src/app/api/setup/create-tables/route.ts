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

    // Insert sample exam data
    const insertDataQuery = `
      INSERT IGNORE INTO exams (exam_id, course_id, exam_name, exam_date, duration, total_marks, passing_marks, exam_type) VALUES
      (1, 1, 'Mathematics Midterm', '2026-06-05 10:00:00', 120, 100, 40, 'midterm'),
      (2, 1, 'Mathematics Final', '2026-07-20 14:00:00', 180, 100, 40, 'final'),
      (3, 2, 'Physics Quiz 1', '2026-06-10 09:00:00', 60, 50, 25, 'quiz'),
      (4, 2, 'Physics Midterm', '2026-06-25 10:00:00', 120, 100, 40, 'midterm'),
      (5, 3, 'Chemistry Final', '2026-07-22 15:00:00', 180, 100, 40, 'final'),
      (6, 4, 'English Composition', '2026-06-15 11:00:00', 120, 100, 40, 'final')
    `;

    await executeQuery(insertDataQuery, []);

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

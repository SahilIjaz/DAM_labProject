import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {

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

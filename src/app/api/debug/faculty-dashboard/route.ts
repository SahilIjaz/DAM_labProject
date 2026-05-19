import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    // Get all faculty members with their departments
    const faculty = await executeQuery(`
      SELECT f.faculty_id, f.user_id, f.department_id, u.first_name, u.last_name, u.email
      FROM faculty f
      JOIN users u ON f.user_id = u.user_id
      LIMIT 10
    `);

    // For each faculty, show what data they would see
    const facultyDetails = await Promise.all(faculty.map(async (f: any) => {
      const courses = await executeQuery(`
        SELECT COUNT(*) as count FROM courses WHERE department_id = ?
      `, [f.department_id]);

      const instructors = await executeQuery(`
        SELECT COUNT(*) as count FROM faculty WHERE department_id = ?
      `, [f.department_id]);

      const students = await executeQuery(`
        SELECT COUNT(*) as count FROM students WHERE department_id = ?
      `, [f.department_id]);

      return {
        faculty_id: f.faculty_id,
        name: `${f.first_name} ${f.last_name}`,
        email: f.email,
        department_id: f.department_id,
        visible_courses: courses[0]?.count || 0,
        visible_instructors: instructors[0]?.count || 0,
        visible_students: students[0]?.count || 0,
      };
    }));

    return NextResponse.json({
      faculty_details: facultyDetails,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

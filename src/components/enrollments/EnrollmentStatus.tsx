'use client';

import { useState, useEffect } from 'react';
import styles from './EnrollmentStatus.module.css';

interface Enrollment {
  enrollment_id: number;
  course_name: string;
  status: string;
  grade?: string;
  semester: number;
}

export default function EnrollmentStatus({ studentId }: { studentId: number }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await fetch(`/api/enrollments?studentId=${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch enrollments');
        const data = await response.json();
        setEnrollments(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [studentId]);

  if (loading) return <div className={styles.loading}>Loading enrollments...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const grouped = enrollments.reduce((acc: { [key: number]: Enrollment[] }, curr) => {
    if (!acc[curr.semester]) acc[curr.semester] = [];
    acc[curr.semester].push(curr);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <h2>Enrollment Status</h2>
      {Object.entries(grouped).map(([semester, courses]) => (
        <div key={semester} className={styles.semester}>
          <h3>Semester {semester}</h3>
          <div className={styles.courseList}>
            {courses.map(enrollment => (
              <div key={enrollment.enrollment_id} className={styles.course}>
                <div className={styles.courseName}>{enrollment.course_name}</div>
                <div className={styles.courseStatus}>
                  <span className={`${styles.badge} ${styles[enrollment.status]}`}>
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </span>
                  {enrollment.grade && <span className={styles.grade}>{enrollment.grade}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

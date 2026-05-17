'use client';

import { useState, useEffect } from 'react';
import styles from './StudentSchedule.module.css';

interface ScheduleItem {
  enrollment_id: number;
  course_code: string;
  course_name: string;
  credit_hours: number;
  first_name?: string;
  last_name?: string;
}

export default function StudentSchedule({
  studentId,
  semester,
}: {
  studentId: number;
  semester: number;
}) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(
          `/api/schedule?type=student&id=${studentId}&semester=${semester}`
        );
        if (!response.ok) throw new Error('Failed to fetch schedule');
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId, semester]);

  if (loading) return <div className={styles.loading}>Loading schedule...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const totalCredits = schedule.reduce((sum, item) => sum + item.credit_hours, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Semester {semester} Schedule</h2>
        <div className={styles.totalCredits}>Total Credits: {totalCredits}</div>
      </div>

      <div className={styles.courses}>
        {schedule.length === 0 ? (
          <div className={styles.empty}>No courses enrolled</div>
        ) : (
          schedule.map(course => (
            <div key={course.enrollment_id} className={styles.course}>
              <div className={styles.courseInfo}>
                <div className={styles.courseCode}>{course.course_code}</div>
                <div className={styles.courseName}>{course.course_name}</div>
                {course.first_name && (
                  <div className={styles.instructor}>
                    {course.first_name} {course.last_name}
                  </div>
                )}
              </div>
              <div className={styles.credits}>{course.credit_hours} credits</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

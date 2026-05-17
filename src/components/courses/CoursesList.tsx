'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/lib/types';
import styles from './CoursesList.module.css';

export default function CoursesList({ departmentId }: { departmentId?: number }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const params = departmentId ? `?departmentId=${departmentId}` : '';
        const response = await fetch(`/api/courses${params}`);
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [departmentId]);

  if (loading) return <div className={styles.loading}>Loading courses...</div>;

  return (
    <div className={styles.container}>
      <h2>Available Courses</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Credits</th>
            <th>Capacity</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.course_id}>
              <td>{course.course_code}</td>
              <td>{course.course_name}</td>
              <td>{course.credit_hours}</td>
              <td>{course.capacity}</td>
              <td>{course.semester}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

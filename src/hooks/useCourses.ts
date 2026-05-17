import { useState, useEffect } from 'react';
import { Course } from '@/lib/types';

export function useCourses(departmentId?: number) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const params = departmentId ? `?departmentId=${departmentId}` : '';
        const response = await fetch(`/api/courses${params}`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [departmentId]);

  return { courses, loading, error };
}

export function useCourseEnrollments(courseId: number) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/enrollments`);
        if (!response.ok) throw new Error('Failed to fetch enrollments');
        const data = await response.json();
        setEnrollments(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [courseId]);

  return { enrollments, loading, error };
}

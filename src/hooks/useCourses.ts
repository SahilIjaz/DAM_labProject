import { useState, useCallback } from 'react';
import { Course } from '@/lib/types';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(
    async (
      departmentId?: number,
      facultyId?: number,
      limit: number = 50,
      offset: number = 0
    ) => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/courses?limit=${limit}&offset=${offset}`;
        if (departmentId) {
          url += `&departmentId=${departmentId}`;
        }
        if (facultyId) {
          url += `&facultyId=${facultyId}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data.data || []);
        return data.data || [];
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchCourses = useCallback(async (term: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/courses?search=${term}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setCourses(data.data || []);
      return data.data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    searchCourses,
  };
}

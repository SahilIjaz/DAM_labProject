import { useState, useCallback } from 'react';
import { Student } from '@/lib/types';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(
    async (departmentId?: number, limit: number = 50, offset: number = 0) => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/students?limit=${limit}&offset=${offset}`;
        if (departmentId) {
          url += `&departmentId=${departmentId}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        setStudents(data.data || []);
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

  const searchStudents = useCallback(async (term: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/students?search=${term}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setStudents(data.data || []);
      return data.data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    loading,
    error,
    fetchStudents,
    searchStudents,
  };
}

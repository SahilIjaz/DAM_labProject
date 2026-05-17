import { useState, useEffect } from 'react';

export function useStudentEnrollments(studentId: number) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/enrollments?studentId=${studentId}`);
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

    if (studentId) fetchEnrollments();
  }, [studentId]);

  return { enrollments, loading, error };
}

export function useSemesterEnrollments(studentId: number, semester: number) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/enrollments?studentId=${studentId}&semester=${semester}`);
        if (!response.ok) throw new Error('Failed to fetch semester enrollments');
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

    if (studentId && semester) fetchEnrollments();
  }, [studentId, semester]);

  return { enrollments, loading, error };
}

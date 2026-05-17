import { useState, useEffect } from 'react';
import { getStudentGrades, getClassGrades } from '@/lib/api/grades';

export function useStudentGrades(studentId: number) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const data = await getStudentGrades(studentId);
        setGrades(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchGrades();
    }
  }, [studentId]);

  return { grades, loading, error };
}

export function useClassGrades(courseId: number, semester: number) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await getClassGrades(courseId, semester);
        setGrades(data);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && semester) {
      fetchGrades();
    }
  }, [courseId, semester]);

  return { grades, loading };
}

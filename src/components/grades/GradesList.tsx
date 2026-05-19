'use client';

import { useEffect, useState } from 'react';


export function GradesList({ studentId }: { studentId: number }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch(`/api/grades?studentId=${studentId}`);
        const data = await response.json();
        setGrades(data);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchGrades();
  }, [studentId]);

  if (loading) return <div>Loading grades...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Academic Grades</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Course</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Type</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Marks</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Percentage</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade: any) => (
            <tr key={grade.result_id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{grade.course_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{grade.exam_type}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{grade.marks_obtained}/{grade.total_marks}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{grade.percentage?.toFixed(2)}%</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(grade.exam_date).toLocaleDateString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

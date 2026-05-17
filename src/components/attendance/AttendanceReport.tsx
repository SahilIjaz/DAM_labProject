'use client';

import { useEffect, useState } from 'react';

export function AttendanceReport({ studentId }: { studentId: number }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(`/api/attendance?studentId=${studentId}`);
        const data = await response.json();
        setAttendance(data);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchAttendance();
  }, [studentId]);

  if (loading) return <div>Loading attendance...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Attendance Report</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {attendance.map((record: any) => (
          <div key={record.course_id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>{record.course_name}</h3>
            <p>Total Classes: {record.total_classes}</p>
            <p style={{ color: '#27ae60' }}>Present: {record.present}</p>
            <p style={{ color: '#e74c3c' }}>Absent: {record.absent}</p>
            <p style={{ color: '#f39c12' }}>Late: {record.late}</p>
            <p><strong>Percentage: {((record.present / record.total_classes) * 100).toFixed(1)}%</strong></p>
          </div>
        ))}
      </div>
    </div>
  );
}

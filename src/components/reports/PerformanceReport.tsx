'use client';

import { useState, useEffect } from 'react';
import styles from './PerformanceReport.module.css';

export default function PerformanceReport({ studentId }: { studentId: number }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports?type=student&id=${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch report');
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [studentId]);

  if (loading) return <div className={styles.loading}>Loading report...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!report) return <div className={styles.empty}>No data available</div>;

  return (
    <div className={styles.container}>
      <h2>Performance Report</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>Student Name</div>
          <div className={styles.value}>{report.first_name} {report.last_name}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Current GPA</div>
          <div className={styles.value}>{report.gpa || 'N/A'}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Semester</div>
          <div className={styles.value}>{report.current_semester}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Completed Courses</div>
          <div className={styles.value}>{report.completed_courses}/{report.total_courses}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Average Percentage</div>
          <div className={styles.value}>{report.avg_percentage ? report.avg_percentage.toFixed(2) : 'N/A'}%</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Total Courses</div>
          <div className={styles.value}>{report.total_courses}</div>
        </div>
      </div>
    </div>
  );
}

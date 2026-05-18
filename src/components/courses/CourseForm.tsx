'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Department {
  department_id: number;
  dept_name: string;
}

export const CourseForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    departmentId: '',
    creditHours: '3',
    capacity: '50',
    semester: '1',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: formData.courseCode,
          courseName: formData.courseName,
          departmentId: parseInt(formData.departmentId),
          creditHours: parseInt(formData.creditHours),
          capacity: parseInt(formData.capacity),
          semester: parseInt(formData.semester),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create course');
      }

      router.push('/courses');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1>Create New Course</h1>
        {error && <div style={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Course Code *</label>
            <input
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="e.g., CS101"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Course Name *</label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="e.g., Introduction to Computer Science"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Department *</label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Credit Hours</label>
              <input
                type="number"
                name="creditHours"
                value={formData.creditHours}
                onChange={handleChange}
                min="1"
                max="6"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                style={styles.input}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={submitting}
              style={styles.submitButton}
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  formWrapper: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  form: {
    marginTop: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

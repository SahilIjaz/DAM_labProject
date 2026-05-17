'use client';

import React, { useState } from 'react';

interface StudentFormProps {
  onSubmit?: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    departmentId: number;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    departmentId: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (
      !formData.email ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.password ||
      !formData.departmentId
    ) {
      setLocalError('All fields are required');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit({
          ...formData,
          departmentId: parseInt(formData.departmentId),
        });
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create student');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h2 style={styles.title}>Create Student Account</h2>

        {(error || localError) && (
          <div style={styles.errorBox}>{error || localError}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@university.edu"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a secure password"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Department</label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              style={styles.input}
              disabled={isLoading}
            >
              <option value="">Select a department</option>
              <option value="1">Computer Science</option>
              <option value="2">Engineering</option>
              <option value="3">Business Administration</option>
              <option value="4">Liberal Arts</option>
              <option value="5">Science</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isLoading ? 0.6 : 1,
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Student'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#ecf0f1',
    padding: '20px',
  },
  formWrapper: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '24px',
  },
  errorBox: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
};

export default StudentForm;

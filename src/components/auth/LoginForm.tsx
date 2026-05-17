'use client';

import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(email, password);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>University Management System</h1>
        <h2 style={styles.subtitle}>Login</h2>

        {(error || localError) && (
          <div style={styles.errorBox}>
            {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isLoading ? 0.6 : 1,
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <a href="/register" style={styles.link}>Register here</a>
        </p>
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
  },
  formWrapper: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '10px',
    fontSize: '28px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: '30px',
    fontSize: '18px',
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
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: 'bold',
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
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  footer: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '14px',
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    cursor: 'pointer',
  },
};

export default LoginForm;

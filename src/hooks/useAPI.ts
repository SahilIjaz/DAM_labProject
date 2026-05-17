import { useState, useCallback } from 'react';

interface UseAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
}

export function useAPI<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (url: string, options: UseAPIOptions = {}) => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          ...options.headers,
        };

        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }

        const result = await response.json();
        setData(result.data || result);
        return result.data || result;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const post = useCallback(
    async (url: string, body: any, options: UseAPIOptions = {}) => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          ...options.headers,
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }

        const result = await response.json();
        setData(result.data || result);
        return result.data || result;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    execute,
    post,
  };
}

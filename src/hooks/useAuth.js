import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);

  const setTokens = useCallback((accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setError(null);
  }, []);

  const apiCall = useCallback(async (url, options = {}) => {
    let token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        token = getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      }
      if (!response.ok) {
        logout();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [getToken]);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch (err) {
      clearTokens();
      return false;
    }
  }, [setTokens, clearTokens]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setTokens]);

  const logout = useCallback(() => {
    clearTokens();
  }, [clearTokens]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await apiCall('/api/auth/me');
      setUser(userData);
      return true;
    } catch (err) {
      setError(err.message);
      logout();
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiCall, logout]);

  const isAuthenticated = useCallback(() => {
    return !!user && !!getToken();
  }, [user, getToken]);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (token) {
        await checkAuth();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [checkAuth, getToken]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated,
  };
};

export default useAuth;
export { useAuth };
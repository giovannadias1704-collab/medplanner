import { useCallback } from 'react';

const useAuth = () => {
  // Retrieves the access token from localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);

  // Sets access and refresh tokens in localStorage
  const setTokens = useCallback((tokens) => {
    if (tokens.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  }, []);

  // Clears authentication tokens from localStorage
  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Clears all localStorage data except Firebase-related keys
  const clearAllLocalStorage = useCallback(() => {
    // Get all keys in localStorage
    const allKeys = Object.keys(localStorage);
    // Filter Firebase keys to preserve them
    const firebaseKeys = allKeys.filter(key => key && key.startsWith('firebase:'));
    // Backup Firebase data
    const firebaseData = {};
    firebaseKeys.forEach(key => {
      firebaseData[key] = localStorage.getItem(key);
    });
    // Clear all localStorage
    localStorage.clear();
    // Restore Firebase data
    firebaseKeys.forEach(key => {
      localStorage.setItem(key, firebaseData[key]);
    });
    return true;
  }, []);

  // Refreshes the access token using the refresh token
  const refreshToken = useCallback(async () => {
    const refreshTkn = localStorage.getItem('refreshToken');
    if (!refreshTkn) return false;

    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTkn }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const tokens = await response.json();
      setTokens(tokens);
      return true;
    } catch (error) {
      clearTokens();
      return false;
    }
  }, [setTokens, clearTokens]);

  // Performs API calls with automatic token refresh on 401
  const apiCall = useCallback(async (endpoint, options = {}) => {
    let token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let retries = 0;
    const maxRetries = 1;

    while (retries <= maxRetries) {
      const config = { ...options, headers };

      const response = await fetch(endpoint, config);

      if (response.status === 401 && retries < maxRetries) {
        const refreshed = await refreshToken();
        if (refreshed) {
          token = getToken();
          headers.Authorization = `Bearer ${token}`;
          retries++;
          continue;
        } else {
          throw new Error('Token refresh failed');
        }
      }

      if (response.ok) {
        return response.json();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    }
  }, [getToken, refreshToken]);

  // Handles user login and sets tokens
  const login = useCallback(async (credentials) => {
    try {
      const response = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setTokens(response.tokens);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [apiCall, setTokens]);

  // COMPLETE logout: clears tokens from localStorage and returns success boolean
  // AppContext can use the return value to perform additional cleanup (e.g., Firebase signOut)
  const logout = useCallback(() => {
    try {
      clearTokens();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }, [clearTokens]);

  // Checks authentication synchronously (just token presence)
  const isAuthenticated = useCallback(() => {
    return !!getToken();
  }, [getToken]);

  // Thorough async auth check: validates token via API
  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return false;
    }
    try {
      await apiCall('/api/me');
      return true;
    } catch (error) {
      clearTokens();
      return false;
    }
  }, [getToken, apiCall, clearTokens]);

  return {
    getToken,
    setTokens,
    clearTokens,
    apiCall,
    refreshToken,
    login,
    logout,
    checkAuth,
    isAuthenticated,
    clearAllLocalStorage,
  };
};

export default useAuth;
export { useAuth };
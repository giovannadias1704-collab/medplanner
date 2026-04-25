// Arquivo 2: useAuth.js
// Salve este arquivo como: src/hooks/useAuth.js

import React, { useState, useEffect, useCallback } from 'react';
import { AUTH } from '../constants.js';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = useCallback(() => {
    return localStorage.getItem(AUTH.STORAGE.TOKEN);
  }, []);

  const setTokens = useCallback((token, refreshToken, userData) => {
    localStorage.setItem(AUTH.STORAGE.TOKEN, token);
    if (refreshToken) {
      localStorage.setItem(AUTH.STORAGE.REFRESH_TOKEN, refreshToken);
    }
    if (userData) {
      localStorage.setItem(AUTH.STORAGE.USER, JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(AUTH.STORAGE.TOKEN);
    localStorage.removeItem(AUTH.STORAGE.REFRESH_TOKEN);
    localStorage.removeItem(AUTH.STORAGE.USER);
    setUser(null);
    setError(null);
  }, []);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(`${AUTH.BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        try {
          await refreshToken();
          const newToken = getToken();
          config.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${AUTH.BASE_URL}${endpoint}`, config);
          if (!retryResponse.ok) {
            throw new Error(errorData.message || 'Falha na autenticação');
          }
          return retryResponse.json();
        } catch (refreshErr) {
          clearTokens();
          throw new Error('Sessão expirada');
        }
      }
      throw new Error(errorData.message || `Erro: ${response.status}`);
    }

    return response.json();
  }, [getToken]);

  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem(AUTH.STORAGE.REFRESH_TOKEN);
    if (!refreshTokenValue) {
      throw new Error('Token de refresh não encontrado');
    }

    const response = await fetch(`${AUTH.BASE_URL}${AUTH.REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error('Falha ao renovar token');
    }

    const data = await response.json();
    setTokens(data.token, data.refreshToken, data.user);
  }, [setTokens]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setTokens(data.token, data.refreshToken, data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, setTokens]);

  const logout = useCallback(async () => {
    try {
      await apiCall(AUTH.LOGOUT, { method: 'POST' });
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      clearTokens();
    }
  }, [apiCall, clearTokens]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await apiCall(AUTH.ME);
      setUser(userData);
    } catch (err) {
      clearTokens();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, apiCall, clearTokens]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user && !loading,
  };
};

export default useAuth;
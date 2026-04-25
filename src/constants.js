// Arquivo 1: constants.js
// Salve este arquivo como: src/constants.js

export const AUTH = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.exemplo.com/api',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  STORAGE: {
    TOKEN: 'auth_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER: 'auth_user',
  }
};
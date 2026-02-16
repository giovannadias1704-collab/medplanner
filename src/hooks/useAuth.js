import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export function useAuth() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AppProvider');
  }
  
  return {
    user: context.user,
    loading: context.loading
  };
}
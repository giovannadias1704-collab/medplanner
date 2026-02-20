import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useAuth() {
  const context = useContext(AppContext);
  const [role, setRole] = useState('user'); // valor padrão
  const [roleLoading, setRoleLoading] = useState(true);

  if (!context) {
    throw new Error('useAuth must be used within AppProvider');
  }

  const { user, loading } = context;

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role || 'user');
          }
        } catch (err) {
          console.error('Erro ao buscar role:', err);
        } finally {
          setRoleLoading(false);
        }
      };
      fetchRole();
    } else {
      setRole('user');
      setRoleLoading(false);
    }
  }, [user]);

  return {
    user,
    loading,
    role,
    roleLoading
  };
}

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { isAdmin, hasActiveSubscription } from '../utils/routeGuards';

/**
 * AdminRoute refatorado.
 * Valida se o usuário é admin via:
 * 1. Email configurado em Firestore (config/adminEmails)
 * 2. Role 'admin' no documento do usuário
 * Também valida se admin tem subscription ativa.
 * Registra tentativas não autorizadas.
 * Exibe loading durante verificação.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos
 * @returns {JSX.Element} Componentes ou redirecionamento
 */
export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        setIsAdminUser(false);
        return;
      }

      try {
        // Buscar documento do usuário no Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn(`[ADMIN] Usuário não encontrado no Firestore: ${user.email}`);
          setIsAdminUser(false);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        // Validar se é admin (role ou email)
        const adminCheck = isAdmin({ ...userData, id: user.uid });

        if (!adminCheck) {
          console.warn(`[SECURITY] Tentativa de acesso admin não autorizado`, {
            userId: user.uid,
            email: user.email,
            role: userData.role,
            timestamp: new Date().toISOString()
          });
          setIsAdminUser(false);
          setLoading(false);
          return;
        }

        // Validar se admin tem subscription ativa
        const hasSubscription = hasActiveSubscription({ ...userData, id: user.uid });

        if (!hasSubscription) {
          console.warn(`[ADMIN] Admin sem subscription ativa`, {
            userId: user.uid,
            email: user.email,
            subscription: userData.subscription?.status
          });
          setError('Admin sem acesso ativo');
          setIsAdminUser(false);
          setLoading(false);
          return;
        }

        setIsAdminUser(true);
        setError(null);
      } catch (err) {
        console.error('[ADMIN] Erro ao verificar permissões:', err);
        setError(err.message);
        setIsAdminUser(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Erro de Acesso</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
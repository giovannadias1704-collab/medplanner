import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isUserAuthenticated, hasActiveSubscription } from '../utils/routeGuards';

/**
 * Componente wrapper para proteger rotas no MedPlanner.
 * - Se loading: exibe spinner.
 * - Se não autenticado: redireciona para /auth.
 * - Se autenticado mas sem assinatura ativa: exibe tela de bloqueio com botão para /pricing.
 * - Caso contrário: renderiza os children.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo protegido a ser renderizado.
 * @returns {JSX.Element} O elemento renderizado.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isUserAuthenticated(user)) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasActiveSubscription(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Bloqueado
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Sua assinatura atual é gratuita e não permite acesso a esta área. Assine um plano premium ou vitalício!
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Escolher Plano
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { registerWithEmail, loginWithEmail, loginWithGoogle, handleRedirectResult } from '../services/auth';
import { auth } from '../config/firebase';
import { isValidEmail } from '../utils/helpers';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Função para limpar estado do Google Login
  const clearGoogleLoginState = () => {
    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');
    setError('');
    setLoading(false);
    console.log('🧹 Estado do Google Login limpo');
  };

  // Verificar redirect do Google PRIMEIRO
  useEffect(() => {
    let isMounted = true;
    
    const checkGoogleRedirect = async () => {
      try {
        console.log('🔍 Verificando redirect do Google...');
        setLoading(true);
        
        const result = await handleRedirectResult();
        
        if (!isMounted) return;
        
        if (result.success && result.user) {
          console.log('✅ Login com Google bem-sucedido!', result.user.email);
          
          // Dar um tempo para o Firebase processar
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (result.isNewUser) {
            console.log('🆕 Novo usuário - indo para onboarding');
            navigate('/onboarding', { replace: true });
          } else {
            console.log('👤 Usuário existente - indo para dashboard');
            navigate('/dashboard', { replace: true });
          }
        } else if (result.error || result.message) {
          console.error('❌ Erro no redirect:', result.message);
          setError(result.message);
          setLoading(false);
        } else {
          console.log('ℹ️ Nenhum redirect pendente');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar redirect:', error);
        if (isMounted) {
          setError('Erro ao processar login. Tente novamente.');
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };
    
    checkGoogleRedirect();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Verificar usuário já autenticado (APÓS verificar redirect)
  useEffect(() => {
    if (checkingAuth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !loading) {
        console.log('🔐 Usuário já autenticado:', user.email);
        
        if (window.location.pathname === '/auth') {
          console.log('➡️ Redirecionando usuário autenticado...');
          navigate('/dashboard', { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, loading, checkingAuth]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidEmail(email)) {
      setError('Email inválido');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!isLogin && !displayName.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        console.log('📧 Tentando login com email...');
        const result = await loginWithEmail(email, password);
        
        if (result.success) {
          console.log('✅ Login com email bem-sucedido');
          if (!result.emailVerified) {
            setSuccess('Login realizado! Verifique seu email para ter acesso completo.');
          }
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        } else {
          console.error('❌ Erro no login:', result.message);
          setError(result.message);
          setLoading(false);
        }
      } else {
        console.log('📝 Tentando registro...');
        const result = await registerWithEmail(email, password, displayName);
        
        if (result.success) {
          console.log('✅ Registro bem-sucedido');
          setSuccess(result.message);
          
          setTimeout(() => {
            navigate('/onboarding', { replace: true });
          }, 2000);
        } else {
          console.error('❌ Erro no registro:', result.message);
          setError(result.message);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('❌ Erro de autenticação:', error);
      setError('Erro ao autenticar. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('🔵 Iniciando login com Google...');
    
    try {
      const result = await loginWithGoogle();

      if (!result.success && result.message) {
        console.error('❌ Erro ao iniciar login Google:', result.message);
        setError(result.message);
        setLoading(false);
      } else if (result.redirecting) {
        console.log('🔄 Redirecionando para o Google...');
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setError('Erro ao iniciar login. Tente novamente.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 animate-fade-in">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">🩺</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              MedPlanner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta gratuitamente'}
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mb-6"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continuar com Google</span>
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                ou continue com email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Seu nome"
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                    disabled={loading}
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-sm animate-fade-in">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1">{error}</p>
                  {error.includes('Login cancelado') && (
                    <button
                      type="button"
                      onClick={clearGoogleLoginState}
                      className="text-xs underline hover:no-underline whitespace-nowrap font-semibold"
                    >
                      Tentar Novamente
                    </button>
                  )}
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-xl text-sm animate-fade-in">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Carregando...
                </span>
              ) : (
                isLogin ? 'Entrar' : 'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              disabled={loading}
              className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium disabled:opacity-50"
            >
              {isLogin ? 'Não tem conta? Criar conta gratuitamente' : 'Já tem conta? Fazer login'}
            </button>
          </div>

          {!isLogin && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Política de Privacidade
              </a>
            </p>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          🩺 Planner completo para estudantes de medicina
        </p>
      </div>

      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
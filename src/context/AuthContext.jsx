import React, { createContext, useState, useEffect, useContext } from 'react';

/**
 * Tipo para o objeto User.
 * @typedef {Object} User
 * @property {string} id - ID do usuário.
 * @property {string} email - Email do usuário.
 * @property {string} name - Nome do usuário.
 */

/**
 * Tipo para o contexto de autenticação.
 * @typedef {Object} AuthContextType
 * @property {User|null} user - Usuário autenticado.
 * @property {string|null} token - Token de autenticação.
 * @property {boolean} loading - Estado de carregamento.
 * @property {string|null} error - Mensagem de erro.
 * @property {function(string, string): Promise<void>} login - Função de login.
 * @property {function(): Promise<void>} logout - Função de logout.
 */

const AuthContext = createContext({});

/**
 * Hook personalizado para usar o contexto de autenticação.
 * Deve ser usado dentro de um AuthProvider.
 * @returns {AuthContextType} O contexto de autenticação.
 * @throws {Error} Se usado fora do AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

/**
 * Provedor de contexto de autenticação.
 * Gerencia estado de autenticação, login, logout, loading e erros.
 * Persiste dados no localStorage.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos.
 * @returns {JSX.Element} O provedor de contexto.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {User|null} */ (null));
  const [token, setToken] = useState(/** @type {string|null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('authUser');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Erro ao carregar dados de autenticação:', err);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Valida as credenciais de login.
   * @param {string} email - Email do usuário.
   * @param {string} password - Senha do usuário.
   * @throws {Error} Se validação falhar.
   */
  const validateCredentials = (email, password) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }
  };

  /**
   * Realiza login com validação e chamada à API.
   * @param {string} email - Email.
   * @param {string} password - Senha.
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      validateCredentials(email, password);

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza logout, limpando estados e localStorage.
   */
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Opcional: chamar API de logout
      // await fetch('/api/logout', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no logout';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

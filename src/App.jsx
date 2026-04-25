import React, { useState, useEffect, useContext, createContext, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// AuthContext - Gerencia autenticação, loading e erros
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      // Simula chamada API de login
      setUser({ id: 1, email: credentials.email, role: 'user' }); // Mude para 'admin' para testar AdminRoute
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    // Verifica token no localStorage ou API
    const token = localStorage.getItem('token');
    if (token) {
      // Valida token
      setUser({ id: 1, role: 'user' });
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setUser: setUser, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// DataContext - Gerencia dados gerais da aplicação (perfil, configs, etc.)
const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Simula fetch de dados
      setData({ profile: { name: 'Usuário' }, stats: { views: 100 } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error, fetchData, setData }}>
      {children}
    </DataContext.Provider>
  );
};

// NotificationContext - Gerencia notificações e toasts
const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    // Remove após 5s
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, loading, error }}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// SettingsContext - Gerencia configurações do usuário (tema, idioma, etc.)
const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ theme: 'light', language: 'pt-BR', notifications: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateSetting = (key, value) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      // Persiste no localStorage
      localStorage.setItem('settings', JSON.stringify({ ...settings, [key]: value }));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // Carrega settings do localStorage
    const saved = localStorage.getItem('settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};

// SubscriptionContext - Gerencia assinatura e pagamentos
const SubscriptionContext = createContext();

const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState({ active: false, plan: 'free', expires: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      // Simula verificação de assinatura
      setSubscription({ active: true, plan: 'pro', expires: new Date(Date.now() + 30*24*60*60*1000) });
    } catch (err) {
      setError('Erro ao verificar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const upgrade = () => {
    // Integração com Stripe ou similar
    addNotification('Upgrade iniciado!'); // Nota: addNotification não acessível aqui devido ao nesting
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, error, checkSubscription, upgrade }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser usado dentro de SubscriptionProvider');
  }
  return context;
};

// Componentes de Rotas Protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Carregando autenticação...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Carregando...</div>;
  return (user && user.role === 'admin') ? children : <Navigate to="/" replace />;
};

// Componentes mantidos: Navigation, etc.
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ background: '#f0f0f0', padding: '1rem' }}>
      <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem' }}>
        <li><a href="/">Home</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
        {user?.role === 'admin' && <li><a href="/admin">Admin</a></li>}
        {user ? (
          <li><button onClick={handleLogout}>Logout</button></li>
        ) : (
          <li><a href="/login">Login</a></li>
        )}
      </ul>
    </nav>
  );
};

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        addNotification('PWA instalada com sucesso!');
        setDeferredPrompt(null);
      }
    }
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#007bff', color: 'white', padding: '1rem', borderRadius: '8px' }}>
      <p>Instalar App?</p>
      <button onClick={handleInstall}>Instalar</button>
      <button onClick={() => setShowInstallPrompt(false)}>Cancelar</button>
    </div>
  );
};

const NotificationToast = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {notifications.map(({ id, message, type }) => (
        <div
          key={id}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            cursor: 'pointer',
            zIndex: 1000
          }}
          onClick={() => removeNotification(id)}
        >
          {message}
        </div>
      ))}
    </>
  );
};

const PaymentBlockedScreen = () => (
  <div style={{ textAlign: 'center', padding: '4rem' }}>
    <h1>Pagamento Bloqueado</h1>
    <p>Sua assinatura está inativa. Renove para acessar o conteúdo.</p>
  </div>
);

const PaymentProofModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addNotification } = useNotifications();

  const handleSubmitProof = () => {
    // Simula upload de comprovante
    addNotification('Comprovante enviado! Aguarde aprovação.', 'info');
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 999 }}
      >
        Enviar Comprovante
      </button>
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px' }}>
            <h2>Comprovante de Pagamento</h2>
            <p>Faça upload do comprovante:</p>
            <input type="file" />
            <div style={{ marginTop: '1rem' }}>
              <button onClick={handleSubmitProof}>Enviar</button>
              <button onClick={() => setIsOpen(false)} style={{ marginLeft: '1rem' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const GlobalAIButton = () => (
  <button 
    style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#ff6b6b',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      fontSize: '1.5rem',
      cursor: 'pointer',
      zIndex: 1000
    }}
  >
    AI
  </button>
);

// Páginas dummy para rotas
const Home = () => {
  const { addNotification } = useNotifications();
  return (
    <div>
      <h1>Bem-vindo à Home</h1>
      <button onClick={() => addNotification('Olá do Home!')}>Notificação</button>
    </div>
  );
};

const Login = () => {
  const { login, error } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(credentials);
  };

  return (
    <div style={{ maxWidth: '300px', margin: 'auto', padding: '2rem' }}>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
          required
        />
        <button type="submit" style={{ width: '100%' }}>Entrar</button>
      </form>
    </div>
  );
};

const Dashboard = () => {
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!subscription.active) {
      navigate('/payment-blocked');
    }
  }, [subscription.active, navigate]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Plano: {subscription.plan}</p>
    </div>
  );
};

const Admin = () => (
  <div>
    <h1>Painel Admin</h1>
    <p>Apenas admins veem isso.</p>
  </div>
);

// AppContent - Conteúdo principal com rotas e componentes globais
const AppContent = () => {
  const { loading: authLoading, error: authError } = useAuth();
  const { loading: subLoading } = useSubscription();

  if (authLoading || subLoading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Carregando aplicação...</div>;
  }

  if (authError) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '4rem' }}>Erro: {authError}</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navigation />
        <GlobalAIButton />
        <InstallPWA />
        <main style={{ padding: '2rem' }}>
          <Suspense fallback={<div>Carregando rota...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="/payment-blocked" element={<PaymentBlockedScreen />} />
              {/* Adicione mais rotas aqui conforme necessário */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
        <NotificationToast />
        <PaymentProofModal />
      </div>
    </Router>
  );
};

// App principal com estrutura de providers solicitada
const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <SettingsProvider>
            <SubscriptionProvider>
              <AppContent />
            </SubscriptionProvider>
          </SettingsProvider>
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;

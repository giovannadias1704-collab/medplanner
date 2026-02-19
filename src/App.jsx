import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useSubscription } from './context/SubscriptionContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './routes/AdminRoute'; // 🔥 IMPORTANTE
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Study from './pages/Study';
import Health from './pages/Health';
import Finances from './pages/Finances';
import Home from './pages/Home';
import Casa from './pages/Casa';
import Wellness from './pages/Wellness';
import Analytics from './pages/Analytics';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import ApproveDiscount from './pages/ApproveDiscount';
import ValidatePayments from './pages/ValidatePayments';
import Navigation from './components/Navigation';
import InstallPWA from './components/InstallPWA';
import NotificationToast from './components/NotificationToast';
import PaymentBlockedScreen from './components/PaymentBlockedScreen';
import PaymentProofModal from './components/PaymentProofModal';
import GlobalAIButton from './components/GlobalAIButton';

function AppContent() {
  const { user, loading } = useAuth();
  const { latestNotification, dismissNotification, removeNotification } = useNotifications();
  const { isAccessBlocked, showPaymentModal } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 🔒 BLOQUEIO POR FALTA DE PAGAMENTO
  if (user && isAccessBlocked()) {
    return <PaymentBlockedScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {user && <Navigation />}
        
        <Routes>
          {/* ROTAS PÚBLICAS */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" />} />

          {/* APROVAÇÃO DE CUPOM (PÚBLICA) */}
          <Route path="/approve-discount" element={<ApproveDiscount />} />

          {/* ROTAS PROTEGIDAS */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />
          
          <Route path="/study" element={
            <ProtectedRoute>
              <Study />
            </ProtectedRoute>
          } />
          
          <Route path="/casa" element={
            <ProtectedRoute>
              <Casa />
            </ProtectedRoute>
          } />
          
          <Route path="/health" element={
            <ProtectedRoute>
              <Health />
            </ProtectedRoute>
          } />
          
          <Route path="/finances" element={
            <ProtectedRoute>
              <Finances />
            </ProtectedRoute>
          } />
          
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="/wellness" element={
            <ProtectedRoute>
              <Wellness />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* 🔐 PAINEL ADMIN (APENAS ADMIN) */}
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />

          {/* 🔐 VALIDAÇÃO DE PAGAMENTOS (APENAS ADMIN) */}
          <Route path="/validate-payments" element={
            <AdminRoute>
              <ValidatePayments />
            </AdminRoute>
          } />

          {/* ROTA RAIZ */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        </Routes>

        {/* COMPONENTES GLOBAIS */}
        {user && <InstallPWA />}
        
        {user && latestNotification && !latestNotification.read && (
          <div className="fixed top-4 right-4 z-50">
            <NotificationToast 
              notification={latestNotification}
              onDismiss={dismissNotification}
              onRemove={removeNotification}
            />
          </div>
        )}

        {user && showPaymentModal && <PaymentProofModal />}
        {user && <GlobalAIButton />}
      </div>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

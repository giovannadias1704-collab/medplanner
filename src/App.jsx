import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useSubscription } from './context/SubscriptionContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import PBL from './pages/PBL';
import Study from './pages/Study';
import Health from './pages/Health';
import Finances from './pages/Finances';
import Home from './pages/Home';
import Wellness from './pages/Wellness';
import Analytics from './pages/Analytics';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';
import InstallPWA from './components/InstallPWA';
import NotificationToast from './components/NotificationToast';
import PaymentBlockedScreen from './components/PaymentBlockedScreen';
import PaymentProofModal from './components/PaymentProofModal';

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

  // BLOQUEIO POR FALTA DE PAGAMENTO
  if (user && isAccessBlocked()) {
    return <PaymentBlockedScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {user && <Navigation />}
        
        <Routes>
          {/* Landing Page - Rota pública */}
          <Route path="/landing" element={<Landing />} />
          
          {/* Auth */}
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" />} />
          
          {/* Rotas protegidas */}
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
          <Route path="/pbl" element={
            <ProtectedRoute>
              <PBL />
            </ProtectedRoute>
          } />
          <Route path="/study" element={
            <ProtectedRoute>
              <Study />
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
          <Route path="/pricing" element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Rota raiz - Landing ou Dashboard */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        </Routes>

        {/* COMPONENTES GLOBAIS */}
        {user && <InstallPWA />}
        
        {/* Toast de Notificações */}
        {user && latestNotification && !latestNotification.read && (
          <div className="fixed top-4 right-4 z-50">
            <NotificationToast 
              notification={latestNotification}
              onDismiss={dismissNotification}
              onRemove={removeNotification}
            />
          </div>
        )}

        {/* Modal de Upload de Comprovante */}
        {user && showPaymentModal && <PaymentProofModal />}
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
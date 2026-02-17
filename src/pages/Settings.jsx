import { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useOnboarding } from '../hooks/useOnboarding';
import { changePassword } from '../services/auth';
import PageHeader from '../components/PageHeader';
import ThemeSelector from '../components/ThemeSelector';
import { applyTheme, getStoredTheme } from '../utils/themeManager';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  MoonIcon, 
  SunIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CameraIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BeakerIcon,
  BellIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  LockClosedIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const context = useContext(AppContext);
  
  // Destructure com fallbacks seguros
  const { 
    user,
    userProfile = {},
    settings = {},
    updateUserProfile,
    uploadProfilePhoto,
    updateTheme,
    updateSettings,
    processPDFWithAI,
    exportAllData,
    notificationPermission,
    requestNotificationPermission,
    clearOldNotifications
  } = context || {};

  const { onboardingData, resetOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const [localProfile, setLocalProfile] = useState({
    displayName: '',
    photoURL: ''
  });
  const [localSettings, setLocalSettings] = useState({
    theme: 'light',
    aiAutoSave: false,
    currency: 'BRL',
    weekStartsOn: 'monday',
    waterGoal: 2.0,
    notifications: true,
    notificationTypes: {
      events: true,
      tasks: true,
      bills: true,
      water: true,
      study: true
    }
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [editingName, setEditingName] = useState(false);
  
  // ========== NOVO: ESTADO PARA ALTERAÇÃO DE SENHA ==========
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estado para temas personalizados
  const [selectedTheme, setSelectedTheme] = useState(() => getStoredTheme());

  // Carregar dados do perfil e settings
  useEffect(() => {
    if (userProfile) {
      setLocalProfile({
        displayName: userProfile.displayName || user?.displayName || '',
        photoURL: userProfile.photoURL || user?.photoURL || ''
      });
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }

    try {
      setUploadingPhoto(true);
      const photoURL = await uploadProfilePhoto(file);
      setLocalProfile(prev => ({ ...prev, photoURL }));
      alert('Foto atualizada com sucesso! ✅');
    } catch (error) {
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    try {
      await updateUserProfile({ displayName: localProfile.displayName });
      setEditingName(false);
      alert('Nome atualizado com sucesso! ✅');
    } catch (error) {
      alert('Erro ao atualizar nome');
    }
  };

  // ========== NOVO: ALTERAR SENHA ==========
  const handleChangePassword = async () => {
    // Validações
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('⚠️ Preencha todos os campos!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('⚠️ A nova senha deve ter pelo menos 6 caracteres!');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('⚠️ As senhas não coincidem!');
      return;
    }

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        alert('✅ Senha alterada com sucesso!');
        setChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert('❌ Erro ao alterar senha. Verifique sua senha atual.');
    }
  };

  const handleThemeChange = async (newTheme) => {
    try {
      if (updateTheme) {
        await updateTheme(newTheme);
      }
      setLocalSettings(prev => ({ ...prev, theme: newTheme }));
    } catch (error) {
      alert('Erro ao alterar tema');
    }
  };

  const handleThemeChangeNew = (newTheme) => {
    setSelectedTheme(newTheme);
    applyTheme(newTheme);
    
    if (updateTheme) {
      updateTheme(newTheme === 'dark' ? 'dark' : 'light');
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      if (updateSettings) {
        const newSettings = { ...localSettings, [key]: value };
        await updateSettings(newSettings);
        setLocalSettings(newSettings);
      }
    } catch (error) {
      alert('Erro ao atualizar configuração');
    }
  };

  const handleNotificationTypeChange = async (type, value) => {
    try {
      if (updateSettings) {
        const newSettings = {
          ...localSettings,
          notificationTypes: {
            ...localSettings.notificationTypes,
            [type]: value
          }
        };
        await updateSettings(newSettings);
        setLocalSettings(newSettings);
      }
    } catch (error) {
      alert('Erro ao atualizar tipo de notificação');
    }
  };

  const handleRequestPermission = async () => {
    if (requestNotificationPermission) {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        alert('✅ Permissão concedida! Você receberá notificações do MedPlanner.');
      } else if (permission === 'denied') {
        alert('❌ Permissão negada. Você pode ativar nas configurações do navegador.');
      }
    }
  };

  const handleClearOldNotifications = async () => {
    if (confirm('Deseja limpar notificações com mais de 30 dias?')) {
      try {
        if (clearOldNotifications) {
          const count = await clearOldNotifications();
          alert(`✅ ${count} notificação(ões) antiga(s) removida(s)!`);
        }
      } catch (error) {
        alert('Erro ao limpar notificações');
      }
    }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF');
      return;
    }

    try {
      setProcessingPDF(true);
      
      if (processPDFWithAI) {
        await processPDFWithAI(file);
      }
      
      alert(`PDF processado! 
      
Em breve, a IA vai extrair eventos automaticamente e adicionar ao seu calendário.

Funcionalidade em desenvolvimento! 🚀`);
      
    } catch (error) {
      alert('Erro ao processar PDF');
    } finally {
      setProcessingPDF(false);
    }
  };

  const handleRefreshOnboarding = () => {
    if (confirm('Deseja refazer o questionário inicial? Seus dados atuais serão mantidos até você finalizar.')) {
      navigate('/onboarding');
    }
  };

  const handleResetOnboarding = () => {
    if (confirm('Isso vai limpar TODOS os seus dados do questionário e refazer do zero. Tem certeza?')) {
      resetOnboarding();
      navigate('/onboarding');
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      try {
        await signOut(auth);
        navigate('/auth');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
  };

  const handleExportData = () => {
    try {
      if (exportAllData) {
        exportAllData();
        alert('Dados exportados com sucesso! ✅');
      }
    } catch (error) {
      alert('Erro ao exportar dados');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Configurações"
        subtitle="Personalize seu planner"
        emoji="⚙️"
        imageQuery="settings,configuration,technology,gear"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Perfil do Usuário */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Perfil de Usuário
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suas informações de conta
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 mb-6">
              {/* Foto de Perfil */}
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-lg">
                  {localProfile.photoURL ? (
                    <img 
                      src={localProfile.photoURL} 
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-20 h-20 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <CameraIcon className="h-5 w-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Informações */}
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={localProfile.displayName}
                        onChange={(e) => setLocalProfile(prev => ({ ...prev, displayName: e.target.value }))}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="Seu nome"
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="p-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">
                        {localProfile.displayName || 'Adicione seu nome'}
                      </p>
                      <button
                        onClick={() => setEditingName(true)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== NOVO: SEÇÃO DE ALTERAÇÃO DE SENHA ========== */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <LockClosedIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Segurança
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Altere sua senha
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChangingPassword(!changingPassword)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium flex items-center gap-2 shadow-lg"
                >
                  <KeyIcon className="h-5 w-5" />
                  {changingPassword ? 'Cancelar' : 'Alterar Senha'}
                </button>
              </div>

              {changingPassword && (
                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Digite sua senha atual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Digite a nova senha (mín. 6 caracteres)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Confirme a nova senha"
                    />
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Confirmar Alteração de Senha
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Aparência */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Aparência
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Escolha seu tema favorito
                </p>
              </div>
            </div>

            <ThemeSelector 
              currentTheme={selectedTheme}
              onThemeChange={handleThemeChangeNew}
            />
          </div>
        </section>

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-xl animate-fade-in"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
          Sair da Conta
        </button>

        {/* Versão */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-6 animate-fade-in">
          <p className="font-medium mb-1">MedPlanner v1.0.0</p>
          <p>Feito com 💙 para estudantes de medicina</p>
        </div>
      </div>
    </div>
  );
}
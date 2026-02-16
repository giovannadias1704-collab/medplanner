import { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { auth } from '../services/firebase';
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
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { 
    user,
    userProfile,
    settings,
    updateUserProfile,
    uploadProfilePhoto,
    updateTheme,
    updateSettings,
    processPDFWithAI,
    exportAllData,
    addEvent
  } = useContext(AppContext);

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
    notifications: true
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [editingName, setEditingName] = useState(false);

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
      // Aplicar tema ao carregar
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

  const handleThemeChange = async (newTheme) => {
    try {
      await updateTheme(newTheme);
      setLocalSettings(prev => ({ ...prev, theme: newTheme }));
    } catch (error) {
      alert('Erro ao alterar tema');
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      const newSettings = { ...localSettings, [key]: value };
      await updateSettings(newSettings);
      setLocalSettings(newSettings);
    } catch (error) {
      alert('Erro ao atualizar configuração');
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
      
      // Processar PDF com IA
      const result = await processPDFWithAI(file);
      
      // Por enquanto, apenas exemplo
      alert(`PDF processado! 
      
Em breve, a IA vai extrair eventos automaticamente e adicionar ao seu calendário.

Funcionalidade em desenvolvimento! 🚀`);
      
    } catch (error) {
      alert('Erro ao processar PDF');
    } finally {
      setProcessingPDF(false);
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
      exportAllData();
      alert('Dados exportados com sucesso! ✅');
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
                  Perfil
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suas informações pessoais
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
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
                  className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl disabled:opacity-50 hover-lift"
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
          </div>
        </section>

        {/* Aparência */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SunIcon className="h-6 w-6 text-white" />
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

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-6 rounded-2xl border-2 transition-all hover-lift ${
                  localSettings.theme === 'light'
                    ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <SunIcon className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Modo Claro
                </p>
                {localSettings.theme === 'light' && (
                  <CheckIcon className="h-5 w-5 text-primary-600 mx-auto mt-2" />
                )}
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-6 rounded-2xl border-2 transition-all hover-lift ${
                  localSettings.theme === 'dark'
                    ? 'border-primary-600 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <MoonIcon className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Modo Escuro
                </p>
                {localSettings.theme === 'dark' && (
                  <CheckIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mx-auto mt-2" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Inteligência Artificial */}
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg border-2 border-purple-200 dark:border-purple-800 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Inteligência Artificial
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configurações de IA
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Auto-save
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Salvar sem confirmar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('aiAutoSave', !localSettings.aiAutoSave)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
                    localSettings.aiAutoSave ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      localSettings.aiAutoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Upload de PDF com IA */}
        <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DocumentArrowUpIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Importar PDF com IA
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Extração automática de eventos
                </p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                📄 Faça upload de cronogramas ou calendários em PDF
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nossa IA vai extrair automaticamente eventos, provas e compromissos! 🤖✨
              </p>
            </div>

            <button
              onClick={() => pdfInputRef.current?.click()}
              disabled={processingPDF}
              className="w-full py-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 transition-all bg-white dark:bg-gray-800 disabled:opacity-50 hover-lift"
            >
              {processingPDF ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    Processando PDF...
                  </span>
                  <span className="text-xs text-gray-500">
                    Isso pode levar alguns segundos
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <DocumentArrowUpIcon className="h-14 w-14 text-blue-500" />
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                    Clique para selecionar PDF
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ou arraste e solte aqui
                  </p>
                </div>
              )}
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePDFUpload}
              className="hidden"
            />
          </div>
        </section>

        {/* Outras Configurações */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎛️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Preferências
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ajuste o app ao seu estilo
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Moeda */}
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover-lift transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Moeda
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Formato de valores
                    </p>
                  </div>
                </div>
                <select
                  value={localSettings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white font-medium transition-all"
                >
                  <option value="BRL">🇧🇷 BRL (R$)</option>
                  <option value="USD">🇺🇸 USD ($)</option>
                  <option value="EUR">🇪🇺 EUR (€)</option>
                </select>
              </div>

              {/* Início da Semana */}
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover-lift transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Início da Semana
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Calendário
                    </p>
                  </div>
                </div>
                <select
                  value={localSettings.weekStartsOn}
                  onChange={(e) => handleSettingChange('weekStartsOn', e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white font-medium transition-all"
                >
                  <option value="monday">Segunda-feira</option>
                  <option value="sunday">Domingo</option>
                </select>
              </div>

              {/* Meta de Água */}
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover-lift transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                    <BeakerIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Meta de Água
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Litros por dia
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={localSettings.waterGoal}
                  onChange={(e) => handleSettingChange('waterGoal', parseFloat(e.target.value))}
                  className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-center font-bold transition-all"
                />
              </div>

              {/* Notificações */}
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover-lift transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                    <BellIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Notificações
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alertas e lembretes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', !localSettings.notifications)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
                    localSettings.notifications ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      localSettings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Backup e Dados */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ArrowDownTrayIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Backup e Dados
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Exporte suas informações
                </p>
              </div>
            </div>

            <button
              onClick={handleExportData}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover-lift"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Exportar Todos os Dados (JSON)
            </button>
          </div>
        </section>

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-xl hover-lift animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
          Sair da Conta
        </button>

        {/* Versão */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <p className="font-medium mb-1">MedPlanner v1.0.0</p>
          <p>Feito com 💙 para estudantes de medicina</p>
        </div>
      </div>
    </div>
  );
}
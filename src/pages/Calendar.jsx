import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import LimitReached from '../components/LimitReached';
import PageHeader from '../components/PageHeader';
import { PlusIcon, ClockIcon, MapPinIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Calendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, canCreateEvent, isFree } = useSubscription();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentDate]);

  const loadEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  // Incrementar contador de eventos no Firebase
  const incrementEventCount = async () => {
    if (!user || !isFree()) return; // Só controla para plano gratuito
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        eventsCount: increment(1)
      });
    } catch (error) {
      console.error('Erro ao incrementar contador de eventos:', error);
    }
  };

  // Decrementar contador de eventos no Firebase
  const decrementEventCount = async () => {
    if (!user || !isFree()) return; // Só controla para plano gratuito
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        eventsCount: increment(-1)
      });
    } catch (error) {
      console.error('Erro ao decrementar contador de eventos:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (day) => {
    return day === selectedDate.getDate() &&
           currentDate.getMonth() === selectedDate.getMonth() &&
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handleDayClick = (day) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleCreateEvent = () => {
    if (!canCreateEvent()) {
      alert(`⚠️ Você atingiu o limite de ${subscription.features.maxEvents} eventos/mês do plano gratuito.\n\nFaça upgrade para ter eventos ilimitados!`);
      navigate('/pricing');
      return;
    }

    setNewEvent({
      ...newEvent,
      date: selectedDate.toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      alert('Por favor, preencha o título do evento.');
      return;
    }

    // Verificar novamente antes de adicionar
    if (!canCreateEvent()) {
      alert(`⚠️ Você atingiu o limite de ${subscription.features.maxEvents} eventos/mês do plano gratuito.\n\nFaça upgrade para ter eventos ilimitados!`);
      setShowAddModal(false);
      navigate('/pricing');
      return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });

      // Incrementar contador
      await incrementEventCount();

      setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
      setShowAddModal(false);
      loadEvents();
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      alert('Erro ao adicionar evento. Tente novamente.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Deseja realmente excluir este evento?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      
      // Decrementar contador
      await decrementEventCount();
      
      loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      alert('Erro ao deletar evento. Tente novamente.');
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedDateEvents = getEventsForDate(selectedDate);

  // Calcular porcentagem de uso (plano gratuito)
  const usagePercentage = isFree() 
    ? ((subscription.eventsCount || 0) / subscription.features.maxEvents) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Agenda"
        subtitle="Organize suas atividades e compromissos"
        emoji="📅"
        imageQuery="calendar,planner,schedule"
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Aviso de limite - Plano Gratuito */}
        {isFree() && (
          <div className={`rounded-2xl p-6 mb-6 border-2 transition-all ${
            usagePercentage >= 80
              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
              : usagePercentage >= 60
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${
                  usagePercentage >= 80
                    ? 'text-red-800 dark:text-red-200'
                    : usagePercentage >= 60
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {usagePercentage >= 80 ? '⚠️ Atenção!' : '📊 Plano Gratuito'}
                </h3>
                <p className={`text-sm mb-3 ${
                  usagePercentage >= 80
                    ? 'text-red-700 dark:text-red-300'
                    : usagePercentage >= 60
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  <strong>{subscription.eventsCount || 0}/{subscription.features.maxEvents}</strong> eventos usados este mês
                  {usagePercentage >= 80 && ' - Você está próximo do limite!'}
                </p>

                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      usagePercentage >= 80
                        ? 'bg-red-500'
                        : usagePercentage >= 60
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {usagePercentage >= 60 && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-sm whitespace-nowrap"
                >
                  ⭐ Fazer Upgrade
                </button>
              )}
            </div>

            {usagePercentage >= 80 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                💡 Faça upgrade para ter eventos ilimitados e nunca mais se preocupar com limites!
              </p>
            )}
          </div>
        )}

        {/* Calendário */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          
          {/* Header do Calendário */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              ←
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              →
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do Mês */}
          <div className="grid grid-cols-7 gap-2">
            {/* Dias vazios antes do primeiro dia */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    isToday(day)
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold shadow-lg'
                      : isSelectedDate(day)
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-600 font-bold'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className={`text-lg ${
                    isToday(day) ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {day}
                  </span>
                  
                  {hasEvents && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isToday(day) ? 'bg-white' : 'bg-purple-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Atividades do Dia Selecionado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📋 {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </h2>
            
            <button
              onClick={handleCreateEvent}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar
            </button>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma atividade para este dia
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {event.time && (
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <ClockIcon className="h-5 w-5 text-purple-600" />
                        <span>{event.time}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <MapPinIcon className="h-5 w-5 text-pink-600" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.description && (
                      <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p>{event.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Evento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ➕ Nova Atividade
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título *"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <input
                type="time"
                placeholder="Horário"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <input
                type="text"
                placeholder="Local"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <textarea
                placeholder="Descrição"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              ></textarea>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
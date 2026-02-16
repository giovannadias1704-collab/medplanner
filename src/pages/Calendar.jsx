import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';

export default function Calendar() {
  const { events, updateEvent, deleteEvent } = useContext(AppContext);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    type: 'event',
    topics: [],
    description: ''
  });
  const [manualTopic, setManualTopic] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsOnDate = (date) => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date + 'T00:00:00');
      return isSameDay(eventDate, date);
    });
  };

  const selectedDayEvents = selectedDate ? eventsOnDate(selectedDate) : [];

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      type: event.type || 'event',
      topics: event.topics || [],
      description: event.description || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = async (eventId, eventTitle) => {
    if (confirm(`Tem certeza que deseja excluir "${eventTitle}"?`)) {
      try {
        await deleteEvent(eventId);
        alert('Evento excluído com sucesso! ✅');
      } catch (error) {
        alert('Erro ao excluir evento');
      }
    }
  };

  const handleAddTopic = () => {
    if (manualTopic.trim()) {
      setEventForm(prev => ({
        ...prev,
        topics: [...prev.topics, manualTopic.trim()]
      }));
      setManualTopic('');
    }
  };

  const handleRemoveTopic = (index) => {
    setEventForm(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await updateEvent(editingEvent.id, eventForm);
      setShowEditModal(false);
      setEditingEvent(null);
      alert('Evento atualizado com sucesso! ✅');
    } catch (error) {
      alert('Erro ao atualizar evento');
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'exam':
        return 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'assignment':
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'meeting':
        return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'event':
      default:
        return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    }
  };

  const getEventTypeEmoji = (type) => {
    switch (type) {
      case 'exam':
        return '📝';
      case 'assignment':
        return '📋';
      case 'meeting':
        return '👥';
      case 'event':
      default:
        return '📅';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'exam':
        return 'Prova';
      case 'assignment':
        return 'Trabalho';
      case 'meeting':
        return 'Reunião';
      case 'event':
      default:
        return 'Evento';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title="Calendário"
        subtitle="Visualize todos os seus compromissos"
        emoji="📅"
        imageQuery="calendar,planner,organizer,schedule"
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navegação do Mês */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mb-6 border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover-scale"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-5 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
              >
                Hoje
              </button>

              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover-scale"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendário Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mb-6 border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((day, index) => {
              const dayEvents = eventsOnDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded-xl text-sm font-medium transition-all relative
                    ${isToday ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-lg scale-105' : ''}
                    ${isSelected && !isToday ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-105' : ''}
                    ${!isSameMonth(day, currentDate) ? 'text-gray-400 dark:text-gray-600' : !isToday && !isSelected ? 'text-gray-900 dark:text-white' : ''}
                    ${!isToday && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover-scale' : ''}
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            isToday ? 'bg-white' : 'bg-primary-500'
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

        {/* Eventos do Dia Selecionado */}
        {selectedDate && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedDayEvents.length} evento(s) neste dia
                </p>
              </div>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-7xl mb-4">📭</div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Dia Livre!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum evento agendado para este dia
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className={`rounded-2xl p-6 shadow-lg border-2 ${getEventTypeColor(event.type)} hover-lift animate-slide-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{getEventTypeEmoji(event.type)}</span>
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/70 dark:bg-black/30 shadow-sm">
                            {getEventTypeLabel(event.type)}
                          </span>
                          {event.time && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 font-medium">
                              🕐 {event.time}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xl mb-2">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-sm opacity-90 mb-3">
                            {event.description}
                          </p>
                        )}
                        {event.topics && event.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {event.topics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-white/70 dark:bg-black/30 px-3 py-1.5 rounded-full font-medium shadow-sm"
                              >
                                📚 {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-3 pt-4 border-t border-current/20">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 rounded-xl transition-all font-semibold shadow-sm hover-lift"
                      >
                        <PencilIcon className="h-5 w-5" />
                        <span className="text-sm">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event.id, event.title)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 rounded-xl transition-all font-semibold shadow-sm hover-lift"
                      >
                        <TrashIcon className="h-5 w-5" />
                        <span className="text-sm">Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 max-w-2xl w-full my-8 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <PencilIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                Editar Evento
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="event">📅 Evento</option>
                  <option value="exam">📝 Prova</option>
                  <option value="assignment">📋 Trabalho</option>
                  <option value="meeting">👥 Reunião</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  rows="3"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Adicione detalhes sobre o evento..."
                />
              </div>

              {eventForm.type === 'exam' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Tópicos da Prova
                  </label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={manualTopic}
                      onChange={(e) => setManualTopic(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Anatomia Cardíaca"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 whitespace-nowrap flex items-center gap-2 font-semibold shadow-lg transition-all hover-lift"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Adicionar
                    </button>
                  </div>

                  {eventForm.topics.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-semibold">
                        📚 {eventForm.topics.length} tópico(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {eventForm.topics.map((topic, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {topic}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTopic(index)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all hover-lift"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
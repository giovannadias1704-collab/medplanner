import { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import QuickCaptureBar from '../components/QuickCaptureBar';
import EventCard from '../components/EventCard';
import { isToday, isTomorrow } from '../utils/dateParser';
import { daysUntil } from '../utils/helpers';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { events, tasks, bills } = useContext(AppContext);

  // Top 3 Prioridades
  const top3Priorities = useMemo(() => {
    const allItems = [
      ...events.map(e => ({ ...e, source: 'event' })),
      ...tasks.map(t => ({ ...t, source: 'task' })),
      ...bills.map(b => ({ ...b, source: 'bill' }))
    ];

    const futureItems = allItems.filter(item => {
      if (!item.date) return false;
      const days = daysUntil(item.date);
      return days >= 0;
    });

    return futureItems
      .sort((a, b) => {
        const daysA = daysUntil(a.date);
        const daysB = daysUntil(b.date);
        return daysA - daysB;
      })
      .slice(0, 3);
  }, [events, tasks, bills]);

  // Próximos eventos (24-72h)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const in3Days = addDays(today, 3);

    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate > today && eventDate <= in3Days;
    });
  }, [events]);

  // Pendências urgentes
  const urgentItems = useMemo(() => {
    const urgent = [];

    bills.forEach(bill => {
      if (!bill.date || bill.paid) return;
      const days = daysUntil(bill.date);
      if (days >= 0 && days <= 3) {
        urgent.push({ ...bill, type: 'bill', urgency: days });
      }
    });

    tasks.forEach(task => {
      if (!task.date || task.completed) return;
      const days = daysUntil(task.date);
      if (days < 0) {
        urgent.push({ ...task, type: 'task', urgency: days });
      }
    });

    return urgent.sort((a, b) => a.urgency - b.urgency);
  }, [bills, tasks]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <PageHeader 
        title={`Bem vindo👋`}
        subtitle={format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        emoji="🏠"
        imageQuery="workspace,desk,morning,coffee"
      />

      <QuickCaptureBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Top 3 Prioridades */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Prioridades de Hoje
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Foco no que realmente importa
              </p>
            </div>
          </div>

          {top3Priorities.length === 0 ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 text-center border-2 border-green-200 dark:border-green-800 shadow-lg">
              <div className="text-6xl mb-3">🎉</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Dia Livre!
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma prioridade urgente. Aproveite o dia!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {top3Priorities.map((item, index) => (
                <div key={item.id} className="flex items-start gap-3 animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <EventCard event={item} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos Eventos (24-72h) */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Próximos Eventos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nos próximos 3 dias
              </p>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-3">📭</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Nenhum evento nos próximos 3 dias
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Tempo livre para focar em outras atividades
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <div key={event.id} className="animate-slide-in" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pendências Urgentes */}
        {urgentItems.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Urgente
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {urgentItems.length} item(ns) precisam de atenção
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {urgentItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 p-5 rounded-2xl shadow-lg hover-lift animate-slide-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {item.type === 'bill' ? '💰' : '✅'}
                        </span>
                        <span className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full font-semibold">
                          {item.type === 'bill' ? 'CONTA' : 'TAREFA'}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {item.urgency < 0
                          ? `⏰ Atrasado há ${Math.abs(item.urgency)} dia(s)`
                          : item.urgency === 0
                          ? '🔥 Vence HOJE'
                          : `📌 Vence em ${item.urgency} dia(s)`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Card Motivacional */}
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-2xl animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-4">
            <div className="text-5xl">💪</div>
            <div>
              <h3 className="text-xl font-bold mb-1">Continue Focado!</h3>
              <p className="text-white/90 text-sm">
                Cada tarefa concluída te aproxima dos seus objetivos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
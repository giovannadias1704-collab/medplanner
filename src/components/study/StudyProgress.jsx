import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { ChartBarIcon, ClockIcon, TrophyIcon, FireIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function StudyProgress() {
  const { studySessions = [], pblCases = [] } = useContext(AppContext);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Calcular estatísticas
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filterByPeriod = (record) => {
      const recordDate = new Date(record.date || record.createdAt);
      if (selectedPeriod === 'week') return recordDate >= startOfWeek;
      if (selectedPeriod === 'month') return recordDate >= startOfMonth;
      if (selectedPeriod === 'year') return recordDate >= startOfYear;
      return true;
    };

    const filterBySubject = (record) => {
      if (selectedSubject === 'all') return true;
      return record.subject === selectedSubject;
    };

    const filteredRecords = studySessions.filter(r => filterByPeriod(r) && filterBySubject(r));

    // Total de horas
    const totalMinutes = filteredRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // Dias estudados
    const uniqueDays = new Set(
      filteredRecords.map(r => new Date(r.date || r.createdAt).toDateString())
    ).size;

    // Média diária
    const avgPerDay = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;

    // Distribuição por matéria
    const bySubject = {};
    filteredRecords.forEach(record => {
      if (!bySubject[record.subject]) {
        bySubject[record.subject] = 0;
      }
      bySubject[record.subject] += record.duration || 0;
    });

    // Sequência de dias
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayRecords = studySessions.filter(r => new Date(r.date || r.createdAt).toDateString() === dateStr);
      const dayMinutes = dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
      last7Days.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        minutes: dayMinutes,
        hours: Math.round(dayMinutes / 60 * 10) / 10
      });
    }

    // Streak (sequência de dias consecutivos)
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const dateStr = checkDate.toDateString();
      const hasStudy = studySessions.some(r => new Date(r.date || r.createdAt).toDateString() === dateStr);
      if (hasStudy) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Casos PBL completados
    const completedPBL = pblCases.filter(c => c.completed).length;

    return {
      totalHours,
      remainingMinutes,
      totalMinutes,
      uniqueDays,
      avgPerDay,
      bySubject,
      last7Days,
      currentStreak,
      completedPBL,
      totalRecords: filteredRecords.length
    };
  }, [studySessions, pblCases, selectedPeriod, selectedSubject]);

  // Lista de matérias únicas
  const subjects = useMemo(() => {
    const subjectSet = new Set(studySessions.map(r => r.subject).filter(Boolean));
    return Array.from(subjectSet);
  }, [studySessions]);

  const maxSubjectMinutes = Math.max(...Object.values(stats.bySubject), 1);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Período */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📅 Período
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={'flex-1 px-4 py-2 rounded-xl font-semibold transition-all ' + 
                  (selectedPeriod === 'week'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')
                }
              >
                Semana
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={'flex-1 px-4 py-2 rounded-xl font-semibold transition-all ' + 
                  (selectedPeriod === 'month'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')
                }
              >
                Mês
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={'flex-1 px-4 py-2 rounded-xl font-semibold transition-all ' + 
                  (selectedPeriod === 'year'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')
                }
              >
                Ano
              </button>
            </div>
          </div>

          {/* Matéria */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📚 Matéria
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas as matérias</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <ClockIcon className="h-10 w-10 mb-3 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Tempo Total</p>
          <p className="text-4xl font-bold">
            {stats.totalHours}h {stats.remainingMinutes > 0 && stats.remainingMinutes + 'm'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <CalendarIcon className="h-10 w-10 mb-3 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Dias Estudados</p>
          <p className="text-4xl font-bold">{stats.uniqueDays}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <ChartBarIcon className="h-10 w-10 mb-3 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Média Diária</p>
          <p className="text-4xl font-bold">{stats.avgPerDay} min</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <FireIcon className="h-10 w-10 mb-3 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Sequência</p>
          <p className="text-4xl font-bold">{stats.currentStreak} dias</p>
        </div>
      </div>

      {/* Gráfico dos Últimos 7 Dias */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          📈 Últimos 7 Dias
        </h3>
        <div className="flex items-end justify-between gap-2 h-64">
          {stats.last7Days.map((day, index) => {
            const maxHeight = Math.max(...stats.last7Days.map(d => d.minutes), 1);
            const heightPercent = (day.minutes / maxHeight) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-xl transition-all duration-500 flex items-end justify-center pb-2"
                    style={{ height: heightPercent + '%' }}
                  >
                    {day.minutes > 0 && (
                      <span className="text-white font-bold text-xs">
                        {day.hours}h
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribuição por Matéria */}
      {Object.keys(stats.bySubject).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            📊 Distribuição por Matéria
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.bySubject)
              .sort((a, b) => b[1] - a[1])
              .map(([subject, minutes]) => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const percentage = Math.round((minutes / stats.totalMinutes) * 100);
                const widthPercent = (minutes / maxSubjectMinutes) * 100;
                
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {subject}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {percentage}%
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {hours > 0 && hours + 'h '}{mins}min
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                        style={{ width: widthPercent + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Conquistas */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
        <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-300 mb-4 flex items-center gap-2">
          <TrophyIcon className="h-6 w-6" />
          Conquistas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={'text-center p-4 rounded-xl ' + 
            (stats.totalHours >= 10 
              ? 'bg-yellow-200 dark:bg-yellow-900/50' 
              : 'bg-gray-200 dark:bg-gray-700 opacity-50')
          }>
            <div className="text-3xl mb-2">🏆</div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">10 Horas</p>
          </div>
          
          <div className={'text-center p-4 rounded-xl ' + 
            (stats.totalHours >= 50 
              ? 'bg-yellow-200 dark:bg-yellow-900/50' 
              : 'bg-gray-200 dark:bg-gray-700 opacity-50')
          }>
            <div className="text-3xl mb-2">🥇</div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">50 Horas</p>
          </div>
          
          <div className={'text-center p-4 rounded-xl ' + 
            (stats.currentStreak >= 7 
              ? 'bg-yellow-200 dark:bg-yellow-900/50' 
              : 'bg-gray-200 dark:bg-gray-700 opacity-50')
          }>
            <div className="text-3xl mb-2">🔥</div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">7 Dias Seguidos</p>
          </div>
          
          <div className={'text-center p-4 rounded-xl ' + 
            (stats.currentStreak >= 30 
              ? 'bg-yellow-200 dark:bg-yellow-900/50' 
              : 'bg-gray-200 dark:bg-gray-700 opacity-50')
          }>
            <div className="text-3xl mb-2">💎</div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">30 Dias Seguidos</p>
          </div>
        </div>
      </div>

      {/* Mensagem se não houver dados */}
      {stats.totalRecords === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <ChartBarIcon className="h-16 w-16 mx-auto text-purple-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Nenhum Registro Encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedPeriod === 'week' && 'Você não estudou nesta semana ainda.'}
            {selectedPeriod === 'month' && 'Você não estudou neste mês ainda.'}
            {selectedPeriod === 'year' && 'Você não estudou neste ano ainda.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Use o Timer para registrar suas sessões de estudo!
          </p>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { generateText } from '../../services/gemini';
import { CalendarIcon, SparklesIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function StudyPlanning({ studyConfig }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    generateSchedule();
  }, []);

  const generateSchedule = async () => {
    setLoading(true);
    
    try {
      const prompt = 'Crie um cronograma semanal de estudos em formato JSON. Matérias: ' + studyConfig.subjects.join(', ') + '. Dias: ' + studyConfig.availableDays.join(', ') + '. Sessão: ' + studyConfig.sessionDuration + ' min. Pausa: ' + studyConfig.breakDuration + ' min. Retorne JSON no formato: {"schedule":{"Segunda":[{"time":"08:00-09:00","subject":"Anatomia","type":"estudo","priority":"alta","description":"Estudo"}]},"recommendations":["Dica"],"totalHours":20,"distribution":{"Anatomia":5}}';
const result = await generateText(prompt);
let cleanResult = result.trim();

// Limpar qualquer markdown
const startMarker = cleanResult.indexOf('{');
const endMarker = cleanResult.lastIndexOf('}');
if (startMarker !== -1 && endMarker !== -1) {
  cleanResult = cleanResult.substring(startMarker, endMarker + 1);
}

const data = JSON.parse(cleanResult);
setSchedule(data);
    } catch (error) {
      console.error('Erro:', error);
      
      const fallbackSchedule = { schedule: {}, recommendations: ['Estude no mesmo horário', 'Faça pausas regulares'], totalHours: 0, distribution: {} };
      const baseHours = Math.floor(20 / studyConfig.subjects.length);
      
      studyConfig.subjects.forEach(subject => {
        const priority = studyConfig.priorities?.[subject]?.priority || 'media';
        let hours = baseHours;
        if (priority === 'alta') hours += 2;
        if (priority === 'baixa') hours -= 1;
        hours = Math.max(hours, 2);
        fallbackSchedule.distribution[subject] = hours;
        fallbackSchedule.totalHours += hours;
      });
      
      studyConfig.availableDays.forEach((day, dayIndex) => {
        fallbackSchedule.schedule[day] = [];
        const startTime = studyConfig.studyHours?.[day]?.start || '08:00';
        let currentHour = parseInt(startTime.split(':')[0]);
        let currentMinute = parseInt(startTime.split(':')[1]);
        
        studyConfig.subjects.forEach((subject, index) => {
          if (index % studyConfig.availableDays.length === dayIndex) {
            const sessionMin = studyConfig.sessionDuration || 50;
            const breakMin = studyConfig.breakDuration || 10;
            const formatTime = (h, m) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
            
            const startH = currentHour;
            const startM = currentMinute;
            const totalStart = startH * 60 + startM;
            const totalEnd = totalStart + sessionMin;
            const endH = Math.floor(totalEnd / 60);
            const endM = totalEnd % 60;
            
            fallbackSchedule.schedule[day].push({
              time: formatTime(startH, startM) + '-' + formatTime(endH, endM),
              subject: subject,
              type: 'estudo',
              priority: studyConfig.priorities?.[subject]?.priority || 'media',
              description: 'Estudo de ' + subject
            });
            
            const breakEnd = totalEnd + breakMin;
            const breakEndH = Math.floor(breakEnd / 60);
            const breakEndM = breakEnd % 60;
            
            fallbackSchedule.schedule[day].push({
              time: formatTime(endH, endM) + '-' + formatTime(breakEndH, breakEndM),
              subject: 'Pausa',
              type: 'break',
              description: 'Descanso'
            });
            
            currentHour = breakEndH;
            currentMinute = breakEndM;
          }
        });
      });
      
      setSchedule(fallbackSchedule);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-semibold">✨ Gerando seu cronograma personalizado...</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-center py-20">
        <SparklesIcon className="h-16 w-16 mx-auto text-purple-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Nenhum cronograma gerado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">📅 Seu Cronograma Semanal</h2>
            <p className="text-purple-100">Gerado com base nas suas preferências</p>
          </div>
          <button onClick={generateSchedule} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all">🔄 Regenerar</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <ClockIcon className="h-6 w-6 mb-2" />
            <p className="text-sm text-purple-100">Total Semanal</p>
            <p className="text-2xl font-bold">{schedule.totalHours}h</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <AcademicCapIcon className="h-6 w-6 mb-2" />
            <p className="text-sm text-purple-100">Matérias</p>
            <p className="text-2xl font-bold">{studyConfig.subjects.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <CalendarIcon className="h-6 w-6 mb-2" />
            <p className="text-sm text-purple-100">Dias de Estudo</p>
            <p className="text-2xl font-bold">{studyConfig.availableDays.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Distribuição de Horas</h3>
        <div className="space-y-3">
          {Object.entries(schedule.distribution || {}).map(([subject, hours]) => (
            <div key={subject} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{subject}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{hours}h</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all" style={{ width: Math.min((hours / schedule.totalHours) * 100, 100) + '%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📆 Cronograma Detalhado</h3>
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {studyConfig.availableDays.map((day) => (
            <button key={day} onClick={() => setSelectedDay(day)} className={'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ' + (selectedDay === day || (selectedDay === null && day === studyConfig.availableDays[0]) ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')}>
              {day}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {(schedule.schedule[selectedDay || studyConfig.availableDays[0]] || []).map((activity, index) => (
            <div key={index} className={'p-4 rounded-xl border-2 ' + (activity.type === 'break' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : activity.priority === 'alta' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : activity.priority === 'media' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800')}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ' + (activity.type === 'break' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200')}>
                    {activity.time.split('-')[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{activity.subject}</h4>
                    {activity.priority && (
                      <span className={'text-xs px-2 py-1 rounded-full font-semibold ' + (activity.priority === 'alta' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' : activity.priority === 'media' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200')}>
                        {activity.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">⏱️ {activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {schedule.recommendations && schedule.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💡 Recomendações</h3>
          <ul className="space-y-2">
            {schedule.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 font-bold">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
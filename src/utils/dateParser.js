import { addDays, addWeeks, addMonths, startOfWeek, endOfWeek, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as chrono from 'chrono-node';

// Parser usando chrono-node (entende linguagem natural)
export function parseRelativeDate(text) {
  const parsed = chrono.pt.parseDate(text, new Date(), { forwardDate: true });
  
  if (parsed) {
    return format(parsed, 'yyyy-MM-dd');
  }
  
  // Fallback: padrões manuais
  const lowerText = text.toLowerCase();
  const today = new Date();
  
  if (lowerText.includes('hoje')) {
    return format(today, 'yyyy-MM-dd');
  }
  
  if (lowerText.includes('amanhã') || lowerText.includes('amanha')) {
    return format(addDays(today, 1), 'yyyy-MM-dd');
  }
  
  if (lowerText.includes('depois de amanhã')) {
    return format(addDays(today, 2), 'yyyy-MM-dd');
  }
  
  // "próxima segunda", "próxima terça", etc.
  const weekdayMatch = lowerText.match(/pr[óo]xim[ao]\s+(segunda|terça|terca|quarta|quinta|sexta|s[áa]bado|sabado|domingo)/);
  if (weekdayMatch) {
    const weekdays = {
      'segunda': 1, 'terca': 2, 'terça': 2, 'quarta': 3, 
      'quinta': 4, 'sexta': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
    };
    const targetDay = weekdays[weekdayMatch[1]];
    let daysToAdd = (targetDay - today.getDay() + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // Próxima semana
    return format(addDays(today, daysToAdd), 'yyyy-MM-dd');
  }
  
  // "dia 20", "dia 15 do próximo mês"
  const dayMatch = lowerText.match(/dia\s+(\d{1,2})/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1]);
    let targetDate = new Date(today.getFullYear(), today.getMonth(), day);
    
    if (lowerText.includes('pr[óo]ximo m[êe]s') || lowerText.includes('mes que vem')) {
      targetDate = addMonths(targetDate, 1);
    } else if (targetDate < today) {
      targetDate = addMonths(targetDate, 1);
    }
    
    return format(targetDate, 'yyyy-MM-dd');
  }
  
  return null;
}

export function formatDateBR(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTimeBR(dateString, timeString) {
  if (!dateString) return '';
  const formattedDate = formatDateBR(dateString);
  return timeString ? `${formattedDate} às ${timeString}` : formattedDate;
}

export function isToday(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isTomorrow(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const tomorrow = addDays(new Date(), 1);
  return date.toDateString() === tomorrow.toDateString();
}
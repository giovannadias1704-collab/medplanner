import { parseNaturalLanguage } from './geminiAPI';
import { parseRelativeDate } from '../utils/dateParser';

// Parser determinístico local (rápido, sem API)
function localParser(text) {
  const lowerText = text.toLowerCase().trim();
  
  // Padrões comuns
  const patterns = {
    exam: /\b(prova|avalia[çc][ãa]o|teste|exame)\b/i,
    bill: /\b(pagar|conta|boleto|vencimento)\b/i,
    workout: /\b(treino|academia|exerc[íi]cio|malhar)\b/i,
    weight: /\b(peso|pesagem|balança)\b/i,
    meal: /\b(comer|almoço|jantar|café|lanche|comida)\b/i,
  };
  
  // Detectar tipo
  let type = 'event';
  if (patterns.exam.test(lowerText)) type = 'exam';
  else if (patterns.bill.test(lowerText)) type = 'bill';
  else if (patterns.workout.test(lowerText)) type = 'workout';
  else if (patterns.weight.test(lowerText)) type = 'weight';
  else if (patterns.meal.test(lowerText)) type = 'meal';
  
  // Extrair data
  const dateMatch = parseRelativeDate(text);
  
  // Extrair valor (para contas)
  const valueMatch = text.match(/r?\$?\s*(\d+(?:[.,]\d{2})?)/i);
  const amount = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : null;
  
  // Extrair horário
  const timeMatch = text.match(/(\d{1,2})[h:](\d{2})?/);
  const startTime = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00')}` : null;
  
  // Confiança baseada em quantas informações conseguimos extrair
  let confidence = 0.5;
  if (dateMatch) confidence += 0.2;
  if (amount) confidence += 0.15;
  if (startTime) confidence += 0.15;
  
  return {
    payload: {
      type,
      title: text.substring(0, 100),
      date: dateMatch,
      startTime,
      endTime: null,
      amount,
      category: type,
      details: null
    },
    interpretation: {
      originalText: text,
      normalizedText: lowerText,
      warnings: [],
      questionsToUser: []
    },
    requireUserConfirmation: confidence < 0.75,
    confidence
  };
}

// Parser híbrido: tenta local primeiro, depois Gemini se necessário
export async function parseUserInput(text) {
  if (!text || text.trim().length < 3) {
    return {
      success: false,
      error: 'Texto muito curto'
    };
  }
  
  // Tentativa 1: Parser local (rápido)
  const localResult = localParser(text);
  
  // Se confiança alta, retorna resultado local
  if (localResult.confidence >= 0.75) {
    return {
      success: true,
      data: localResult,
      source: 'local'
    };
  }
  
  // Tentativa 2: Gemini API (mais inteligente)
  try {
    const geminiResult = await parseNaturalLanguage(text);
    
    if (geminiResult.success) {
      return {
        success: true,
        data: geminiResult.data,
        source: 'gemini'
      };
    }
  } catch (error) {
    console.error('Erro no Gemini, usando resultado local:', error);
  }
  
  // Fallback: retorna resultado local mesmo com confiança baixa
  return {
    success: true,
    data: localResult,
    source: 'local-fallback'
  };
}
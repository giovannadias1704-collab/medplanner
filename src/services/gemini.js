import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🔑 API Key carregada:', API_KEY ? 'SIM ✅' : 'NÃO ❌');

if (!API_KEY) {
  console.error('⚠️ VITE_GEMINI_API_KEY não configurada no arquivo .env');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Usar gemini-2.5-flash (modelo mais recente e rápido)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash'
});

console.log('🤖 Modelo configurado: gemini-2.5-flash');

// FUNÇÃO: Chat simples
export async function chatWithAI(message, context = '') {
  try {
    console.log('📤 Enviando mensagem para Gemini:', message);
    
    const prompt = context 
      ? `Contexto: ${context}\n\nUsuário: ${message}\n\nResposta (seja conciso e útil):`
      : message;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Resposta recebida com sucesso!');

    return {
      success: true,
      response: text,
      tokens: response.usageMetadata || {}
    };
  } catch (error) {
    console.error('❌ Erro ao chamar Gemini:', error);
    console.error('❌ Mensagem:', error.message);
    
    return {
      success: false,
      error: error.message,
      response: 'Desculpe, não consegui processar sua mensagem. Erro: ' + error.message
    };
  }
}

// FUNÇÃO: Sugestões de estudo
export async function getStudySuggestions(subject, goals, availableTime) {
  const prompt = `Você é um assistente especializado em medicina e estudos médicos.

Assunto: ${subject}
Objetivos: ${goals}
Tempo disponível: ${availableTime} horas por semana

Crie um plano de estudos semanal detalhado e prático, incluindo:
1. Divisão de tópicos por dia
2. Tempo estimado para cada atividade
3. Técnicas de estudo recomendadas
4. Recursos sugeridos (livros, vídeos, artigos)

Seja específico e objetivo.`;

  return await chatWithAI(prompt);
}

// FUNÇÃO: Analisar PBL
export async function analyzePBL(pblTitle, pblDescription, objectives) {
  const prompt = `Você é um tutor de Problem-Based Learning (PBL) para estudantes de medicina.

Título do PBL: ${pblTitle}
Descrição: ${pblDescription}
Objetivos atuais: ${objectives || 'Não definidos'}

Analise este caso PBL e forneça:
1. Objetivos de aprendizagem detalhados (mínimo 5)
2. Tópicos principais a serem estudados
3. Perguntas norteadoras para discussão
4. Recursos bibliográficos recomendados (livros e artigos)
5. Sugestões de como abordar o caso

Seja específico e prático.`;

  return await chatWithAI(prompt);
}

// FUNÇÃO: Criar Flashcards
export async function generateFlashcards(topic, quantity = 10) {
  const prompt = `Crie ${quantity} flashcards sobre: ${topic}

Formato para cada flashcard:
FRENTE: [pergunta objetiva]
VERSO: [resposta clara e concisa]

Foque em conceitos importantes, fatos clínicos relevantes e informações que estudantes de medicina precisam memorizar.

Separe cada flashcard com "---"`;

  return await chatWithAI(prompt);
}

// FUNÇÃO: Criar cronograma inteligente
export async function createSmartSchedule(events, preferences, goals) {
  const prompt = `Você é um assistente de produtividade para estudantes de medicina.

Eventos existentes: ${JSON.stringify(events)}
Preferências: ${preferences}
Objetivos da semana: ${goals}

Crie um cronograma semanal otimizado que:
1. Respeite os eventos já marcados
2. Inclua blocos de estudo estratégicos
3. Considere pausas e descanso
4. Sugira horários ideais para cada atividade
5. Equilibre estudo, saúde e bem-estar

Retorne em formato de lista organizada por dia.`;

  return await chatWithAI(prompt);
}

// FUNÇÃO: Resumir texto
export async function summarizeText(text, maxLength = 200) {
  const prompt = `Resuma o seguinte texto em no máximo ${maxLength} palavras, mantendo as informações mais importantes:

${text}`;

  return await chatWithAI(prompt);
}

// FUNÇÃO: Responder dúvidas médicas (educacional)
export async function answerMedicalQuestion(question) {
  const prompt = `Você é um assistente educacional para estudantes de medicina. Responda a seguinte dúvida de forma didática e baseada em evidências:

${question}

IMPORTANTE: 
- Esta é uma resposta educacional para estudantes
- Não substitui consulta médica real
- Cite fontes quando possível
- Seja claro e objetivo`;

  return await chatWithAI(prompt);
}

export default {
  chatWithAI,
  getStudySuggestions,
  analyzePBL,
  generateFlashcards,
  createSmartSchedule,
  summarizeText,
  answerMedicalQuestion
};
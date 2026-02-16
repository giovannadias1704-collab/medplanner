import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    temperature: 0.3,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  }
});

export async function parseNaturalLanguage(text, context = {}) {
  const prompt = `Você é um assistente especializado em interpretar comandos de um planner médico.

CONTEXTO DO USUÁRIO:
- Estudante de medicina, 3º semestre
- Modelo PBL (Problem-Based Learning)
- Mora sozinha
- Data atual: ${new Date().toLocaleDateString('pt-BR')}

TEXTO DO USUÁRIO: "${text}"

INSTRUÇÕES:
1. Identifique o tipo de item: evento, tarefa, prova, conta, treino, refeição, peso, ou observação
2. Extraia informações estruturadas (título, data, horário, valor, etc.)
3. Se a data for relativa ("amanhã", "próxima semana", "dia 20"), calcule a data real
4. Se faltar informação crítica, indique em "questionsToUser"

RESPONDA APENAS EM JSON VÁLIDO (sem markdown, sem explicações):
{
  "payload": {
    "type": "event|task|exam|bill|workout|meal|weight|note",
    "title": "string",
    "date": "YYYY-MM-DD ou null",
    "startTime": "HH:MM ou null",
    "endTime": "HH:MM ou null",
    "amount": "number ou null",
    "category": "string ou null",
    "details": "string ou null"
  },
  "interpretation": {
    "originalText": "${text}",
    "normalizedText": "texto normalizado",
    "warnings": ["avisos se houver ambiguidade"],
    "questionsToUser": ["perguntas para completar informações faltantes"]
  },
  "requireUserConfirmation": true ou false,
  "confidence": 0.0 a 1.0
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    const cleanText = textResponse.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanText);
    
    return {
      success: true,
      data: parsed
    };
  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

export async function improveText(text, type = 'general') {
  const prompts = {
    general: `Melhore este texto mantendo o significado: "${text}"`,
    medical: `Melhore este texto médico/acadêmico: "${text}"`,
    summary: `Resuma este texto de forma concisa: "${text}"`
  };

  try {
    const result = await model.generateContent(prompts[type] || prompts.general);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao melhorar texto:', error);
    return text;
  }
}
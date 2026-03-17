import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('⚠️ VITE_GEMINI_API_KEY não configurada no arquivo .env');
}

let genAI;
let model;

try {
  genAI = new GoogleGenerativeAI(API_KEY);
model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' }, { apiVersion: 'v1' });
} catch (error) {
  console.error('❌ Erro ao inicializar Gemini:', error);
}

// ─── Trata erros da API de forma amigável ─────────────────────────────────────
function friendlyError(error) {
  const msg = error?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    return '⏳ A IA está temporariamente indisponível. Tente novamente em alguns minutos.';
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return '⚠️ Serviço de IA temporariamente indisponível.';
  }
  if (msg.includes('API key') || msg.includes('403')) {
    return '🔑 Configuração da IA pendente. Contate o suporte.';
  }
  return '⚠️ A IA está indisponível no momento. Tente novamente em breve.';
}

// ─── Converte File para base64 ────────────────────────────────────────────────
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Extrai texto de PDF ──────────────────────────────────────────────────────
async function extractPDFText(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
  }

  return fullText;
}

// ─── SISTEMA DE INTENÇÕES ─────────────────────────────────────────────────────
const INTENT_SYSTEM_PROMPT = `
Você é o assistente do MedPlanner, um app de organização para estudantes de medicina brasileiros.

Você tem MEMÓRIA da conversa — sempre leve em conta o que foi dito anteriormente para dar respostas coerentes e contextuais.

Você pode executar ações no app quando o usuário pedir.

QUANDO EXECUTAR AÇÕES:
- Usuário mencionar gasto, despesa, conta, pagamento → ADD_BILL
- Usuário mencionar evento, compromisso, aula, prova, consulta → ADD_EVENT
- Usuário mencionar tarefa, afazer, to-do, lembrete de atividade → ADD_TASK
- Usuário mencionar tarefa doméstica, limpar, lavar, arrumar → ADD_HOME_TASK
- Usuário mencionar que bebeu água, hidratação → LOG_WATER
- Qualquer outro assunto → NONE

FORMATO OBRIGATÓRIO DA RESPOSTA:
Sempre responda em JSON válido, sem markdown, sem backticks, exatamente assim:

{
  "action": "NONE" | "ADD_BILL" | "ADD_EVENT" | "ADD_TASK" | "ADD_HOME_TASK" | "LOG_WATER",
  "actionData": { ... } ou null,
  "message": "sua resposta para o usuário aqui"
}

EXEMPLOS:

Usuário: "gastei 35 reais no almoço"
{
  "action": "ADD_BILL",
  "actionData": { "description": "Almoço", "amount": 35, "date": "hoje" },
  "message": "✅ Adicionei R$ 35,00 em Finanças!"
}

Usuário: "tenho prova de anatomia na sexta às 8h"
{
  "action": "ADD_EVENT",
  "actionData": { "title": "Prova de Anatomia", "date": "sexta-feira", "time": "08:00", "eventType": "exam", "description": "Prova" },
  "message": "✅ Prova de Anatomia adicionada na agenda para sexta às 8h!"
}

Usuário: "adiciona tarefa: revisar farmacologia"
{
  "action": "ADD_TASK",
  "actionData": { "title": "Revisar farmacologia", "date": "hoje", "priority": "média" },
  "message": "✅ Tarefa criada!"
}

Usuário: "bebi 500ml de água"
{
  "action": "LOG_WATER",
  "actionData": { "amount": 0.5 },
  "message": "💧 Registrei 500ml de água!"
}

Usuário: "me explica o ciclo cardíaco"
{
  "action": "NONE",
  "actionData": null,
  "message": "O ciclo cardíaco é composto por... [resposta completa aqui]"
}
`;

// ─── CHAT PRINCIPAL ───────────────────────────────────────────────────────────
export async function chatWithAI(message, userContext = {}, files = [], history = []) {
  try {
    if (!model) throw new Error('Modelo não inicializado.');

    const contextBlock = `
=== DADOS DO USUÁRIO ===
${userContext.name ? `Nome: ${userContext.name}` : ''}
${userContext.finances ? `Finanças: Total pendente R$${userContext.finances.totalPending || 0}, ${userContext.finances.pendingCount || 0} contas a pagar` : ''}
${userContext.events ? `Próximos eventos: ${userContext.events.map(e => e.title).join(', ')}` : ''}
${userContext.tasks ? `Tarefas pendentes: ${userContext.tasks.pending}` : ''}
Data atual: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
========================`;

    const systemAndContext = `${INTENT_SYSTEM_PROMPT}\n\n${contextBlock}`;

    const filteredHistory = history.filter(m => m.role === 'user' || m.role === 'assistant');
    const firstUserIndex = filteredHistory.findIndex(m => m.role === 'user');
    const trimmedHistory = firstUserIndex >= 0 ? filteredHistory.slice(firstUserIndex) : [];

    const alternatedHistory = [];
    for (const msg of trimmedHistory) {
      const lastRole = alternatedHistory[alternatedHistory.length - 1]?.role;
      const currentRole = msg.role === 'assistant' ? 'model' : 'user';
      if (currentRole !== lastRole) {
        alternatedHistory.push({ role: currentRole, content: msg.content });
      }
    }

    if (alternatedHistory[alternatedHistory.length - 1]?.role === 'model') {
      alternatedHistory.pop();
    }

    const geminiHistory = alternatedHistory.map((msg, i) => ({
      role: msg.role,
      parts: [{
        text: (i === 0 && msg.role === 'user')
          ? `${systemAndContext}\n\nUsuário: ${msg.content}`
          : msg.content
      }]
    }));

    const currentParts = [];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        currentParts.push({ inlineData: { mimeType: file.type, data: base64 } });
        currentParts.push({ text: `[Imagem anexada: ${file.name}]` });
      } else if (file.type === 'application/pdf') {
        try {
          const pdfText = await extractPDFText(file);
          currentParts.push({ text: `[Conteúdo do PDF "${file.name}"]\n${pdfText.substring(0, 10000)}\n[Fim do PDF]` });
        } catch {
          currentParts.push({ text: `[PDF: ${file.name} - erro ao extrair texto]` });
        }
      }
    }

    if (geminiHistory.length === 0) {
      currentParts.push({ text: `${systemAndContext}\n\nUsuário: ${message || 'Analise os arquivos acima.'}` });
    } else {
      currentParts.push({ text: `Usuário: ${message || 'Analise os arquivos acima.'}` });
    }

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(currentParts);
    const text = result.response.text();

    try {
      const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleaned);
      return {
        success: true,
        action: parsed.action || 'NONE',
        actionData: parsed.actionData || null,
        response: parsed.message || text,
        raw: parsed
      };
    } catch {
      return { success: true, action: 'NONE', actionData: null, response: text };
    }

  } catch (error) {
    console.error('❌ Erro Gemini:', error);
    return {
      success: false,
      action: 'NONE',
      actionData: null,
      response: friendlyError(error),
    };
  }
}

// ─── FLASHCARDS ───────────────────────────────────────────────────────────────
export async function generateFlashcards(topic, quantity = 15, pdfText = '') {
  if (!model) throw new Error('Modelo não inicializado.');

  const sourceText = pdfText ? `\n\nConteúdo base:\n${pdfText.substring(0, 8000)}` : '';
  const prompt = `Crie EXATAMENTE ${quantity} flashcards sobre: ${topic}${sourceText}

REGRAS:
- Retorne APENAS os flashcards, sem texto antes ou depois
- Formato exato:

FRENTE: [pergunta]
VERSO: [resposta, máximo 3 linhas]

---

Comece agora:`;

  try {
    const result = await model.generateContent(prompt);
    return { success: true, action: 'NONE', actionData: null, response: result.response.text() };
  } catch (error) {
    return { success: false, action: 'NONE', actionData: null, response: friendlyError(error) };
  }
}

// ─── CRONOGRAMA ───────────────────────────────────────────────────────────────
export async function createSchedule(details) {
  if (!model) throw new Error('Modelo não inicializado.');

  const prompt = `Crie um cronograma de estudos semanal para um estudante de medicina.
Detalhes: ${details}

📅 CRONOGRAMA SEMANAL

Segunda-feira:
• 07:00 - 09:00 | [atividade]

[continue para todos os dias]

⚠️ Dicas: [3 dicas práticas]`;

  try {
    const result = await model.generateContent(prompt);
    return { success: true, action: 'NONE', actionData: null, response: result.response.text() };
  } catch (error) {
    return { success: false, action: 'NONE', actionData: null, response: friendlyError(error) };
  }
}

// ─── ANÁLISE DE PBL ───────────────────────────────────────────────────────────
export async function analyzePBL(pblText) {
  if (!model) throw new Error('Modelo não inicializado.');

  const prompt = `Analise este caso PBL de medicina:

${pblText}

🔍 PALAVRAS-CHAVE
❓ PROBLEMAS IDENTIFICADOS
🎯 HIPÓTESES DIAGNÓSTICAS
📚 OBJETIVOS DE APRENDIZAGEM
🔗 CORRELAÇÕES`;

  try {
    const result = await model.generateContent(prompt);
    return { success: true, action: 'NONE', actionData: null, response: result.response.text() };
  } catch (error) {
    return { success: false, action: 'NONE', actionData: null, response: friendlyError(error) };
  }
}

// ─── TEXTO SIMPLES ────────────────────────────────────────────────────────────
export async function generateText(prompt) {
  if (!model) {
    throw new Error('⚠️ Serviço de IA temporariamente indisponível.');
  }
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    // Lança erro amigável em vez do técnico
    throw new Error(friendlyError(error));
  }
}

export default { generateText, chatWithAI, generateFlashcards, createSchedule, analyzePBL };

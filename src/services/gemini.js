import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('⚠️ VITE_GEMINI_API_KEY não configurada no arquivo .env');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
// O Gemini retorna uma action quando identifica que deve executar algo no app.
// O frontend lê essa action e executa no Firebase.
//
// Actions disponíveis:
//   ADD_EXPENSE    → { description, amount, category, date }
//   ADD_EVENT      → { title, date, time, description }
//   ADD_TASK       → { title, dueDate, priority }
//   ADD_GOAL       → { title, targetAmount, targetDate, category }
//   NONE           → só resposta em texto

const INTENT_SYSTEM_PROMPT = `
Você é o assistente do MedPlanner, um app de organização para estudantes de medicina brasileiros.

Você tem acesso aos dados reais do usuário (fornecidos abaixo) e pode executar ações no app.

QUANDO EXECUTAR AÇÕES:
Se o usuário pedir para adicionar gasto, despesa, conta → use ADD_EXPENSE
Se o usuário pedir para adicionar evento, compromisso, aula, prova → use ADD_EVENT  
Se o usuário pedir para adicionar tarefa, to-do → use ADD_TASK
Se o usuário pedir para criar meta, objetivo de economia → use ADD_GOAL
Caso contrário → use NONE e responda normalmente

FORMATO OBRIGATÓRIO DA RESPOSTA:
Sempre responda em JSON válido, sem markdown, sem backticks, exatamente assim:

{
  "action": "NONE" | "ADD_EXPENSE" | "ADD_EVENT" | "ADD_TASK" | "ADD_GOAL",
  "actionData": { ... } ou null,
  "message": "sua resposta para o usuário aqui"
}

EXEMPLOS:

Usuário: "gastei 35 reais no almoço"
{
  "action": "ADD_EXPENSE",
  "actionData": { "description": "Almoço", "amount": 35, "category": "Alimentação", "date": "hoje" },
  "message": "✅ Adicionei R$ 35,00 na categoria Alimentação!"
}

Usuário: "tenho prova de anatomia na sexta às 8h"
{
  "action": "ADD_EVENT", 
  "actionData": { "title": "Prova de Anatomia", "date": "sexta-feira", "time": "08:00", "description": "Prova" },
  "message": "✅ Evento adicionado na sua agenda para sexta às 8h!"
}

Usuário: "me explica o ciclo cardíaco"
{
  "action": "NONE",
  "actionData": null,
  "message": "O ciclo cardíaco é composto por... [resposta completa aqui]"
}
`;

// ─── CHAT PRINCIPAL com contexto do usuário ───────────────────────────────────
export async function chatWithAI(message, userContext = {}, files = []) {
  try {
    const parts = [];

    // Processa arquivos
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        parts.push({ inlineData: { mimeType: file.type, data: base64 } });
        parts.push({ text: `[Imagem anexada: ${file.name}]` });
      } else if (file.type === 'application/pdf') {
        try {
          const pdfText = await extractPDFText(file);
          parts.push({ text: `[Conteúdo do PDF "${file.name}"]\n${pdfText.substring(0, 10000)}\n[Fim do PDF]` });
        } catch {
          parts.push({ text: `[PDF: ${file.name} - erro ao extrair texto]` });
        }
      }
    }

    // Monta contexto do usuário
    const contextBlock = Object.keys(userContext).length > 0 ? `
=== DADOS DO USUÁRIO ===
${userContext.name ? `Nome: ${userContext.name}` : ''}
${userContext.finances ? `Finanças do mês: Total gasto R$${userContext.finances.totalMonth || 0}, Contas pendentes: ${userContext.finances.pending || 0}` : ''}
${userContext.events ? `Próximos eventos: ${userContext.events.slice(0, 3).map(e => e.title).join(', ')}` : ''}
${userContext.goals ? `Metas ativas: ${userContext.goals.slice(0, 3).map(g => g.title).join(', ')}` : ''}
Data atual: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
========================
` : `Data atual: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`;

    parts.push({
      text: `${INTENT_SYSTEM_PROMPT}\n\n${contextBlock}\n\nUsuário: ${message || 'Analise os arquivos acima.'}`
    });

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Tenta parsear como JSON (sistema de intenções)
    try {
      const parsed = JSON.parse(text.trim());
      return {
        success: true,
        action: parsed.action || 'NONE',
        actionData: parsed.actionData || null,
        response: parsed.message || text,
        raw: parsed
      };
    } catch {
      // Se não veio JSON (resposta livre), retorna sem action
      return {
        success: true,
        action: 'NONE',
        actionData: null,
        response: text
      };
    }

  } catch (error) {
    console.error('❌ Erro Gemini:', error);
    return {
      success: false,
      action: 'NONE',
      actionData: null,
      response: `Erro ao processar: ${error.message}`
    };
  }
}

// ─── FLASHCARDS (prompt preciso, entrega o formato certo) ─────────────────────
export async function generateFlashcards(topic, quantity = 15, pdfText = '') {
  const sourceText = pdfText
    ? `\n\nConteúdo base para os flashcards:\n${pdfText.substring(0, 8000)}`
    : '';

  const prompt = `Crie EXATAMENTE ${quantity} flashcards sobre: ${topic}${sourceText}

REGRAS OBRIGATÓRIAS:
- Retorne APENAS os flashcards, sem introdução, sem explicação, sem texto antes ou depois
- Cada flashcard deve ter exatamente este formato, sem variações:

FRENTE: [pergunta objetiva e clara]
VERSO: [resposta concisa, máximo 3 linhas]

---

- Foque em conceitos clínicos, fisiologia, farmacologia e o que cai em provas
- Não numere os flashcards
- Não adicione comentários entre eles

Comece agora diretamente com o primeiro flashcard:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { success: true, action: 'NONE', actionData: null, response: text };
  } catch (error) {
    return { success: false, action: 'NONE', actionData: null, response: `Erro: ${error.message}` };
  }
}

// ─── CRONOGRAMA ───────────────────────────────────────────────────────────────
export async function createSchedule(details) {
  const prompt = `Crie um cronograma de estudos semanal para um estudante de medicina.

Detalhes: ${details}

FORMATO OBRIGATÓRIO (retorne APENAS o cronograma, sem texto antes):

📅 CRONOGRAMA SEMANAL

Segunda-feira:
• 07:00 - 09:00 | [atividade]
• ...

Terça-feira:
• ...

[continue para todos os dias]

⚠️ Dicas de execução:
• [3 dicas práticas]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { success: true, action: 'NONE', actionData: null, response: text };
  } catch (error) {
    return { success: false, action: 'NONE', actionData: null, response: `Erro: ${error.message}` };
  }
}

// ─── ANÁLISE DE PBL ───────────────────────────────────────────────────────────
export async function analyzePBL(pblText) {
  const prompt = `Analise este caso PBL de medicina e estruture a abertura de caixa:

${pblText}

Retorne neste formato:

🔍 PALAVRAS-CHAVE
• [liste os termos relevantes do caso]

❓ PROBLEMAS IDENTIFICADOS
• [liste os problemas/queixas]

🎯 HIPÓTESES DIAGNÓSTICAS
1. [hipótese principal]
2. [hipótese alternativa]

📚 OBJETIVOS DE APRENDIZAGEM
1. [objetivo claro e específico]
2. ...

🔗 CORRELAÇÕES
• [correlações fisiológicas/clínicas relevantes]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { success: true, action: 'NONE', actionData: null, response: text };
  } catch (error) {
    return { success: false, action: 'NONE', actionData: null, response: `Erro: ${error.message}` };
  }
}

// ─── TEXTO SIMPLES (para casos que não precisam de intenção) ──────────────────
export async function generateText(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    throw error;
  }
}

export default {
  generateText,
  chatWithAI,
  generateFlashcards,
  createSchedule,
  analyzePBL
};
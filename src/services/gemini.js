import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🔑 API Key carregada:', API_KEY ? 'SIM ✅' : 'NÃO ❌');

if (!API_KEY) {
  console.error('⚠️ VITE_GEMINI_API_KEY não configurada no arquivo .env');
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

console.log('🤖 Modelo configurado: gemini-2.5-flash');

// ─── Converte File para base64 ─────────────────────────────────────────────────
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove o prefixo "data:mime/type;base64," e retorna só o base64
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Extrai texto de PDF para enviar como contexto ────────────────────────────
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

// FUNÇÃO: Gerar texto simples
export async function generateText(prompt) {
  try {
    console.log('📤 Enviando prompt para Gemini:', prompt.substring(0, 100) + '...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Resposta recebida com sucesso!');
    return text;
  } catch (error) {
    console.error('❌ Erro ao gerar texto:', error);
    throw error;
  }
}

// FUNÇÃO: Chat com suporte real a arquivos (imagens e PDFs)
export async function chatWithAI(message, context = '', files = []) {
  try {
    console.log('📤 Enviando mensagem para Gemini:', message);
    console.log('📎 Arquivos anexados:', files.length);

    const parts = [];

    // Processa cada arquivo
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Imagem: envia como inlineData (base64)
        const base64 = await fileToBase64(file);
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64
          }
        });
        parts.push({ text: `[Imagem anexada: ${file.name}]` });

      } else if (file.type === 'application/pdf') {
        // PDF: extrai o texto e envia como contexto
        try {
          const pdfText = await extractPDFText(file);
          parts.push({
            text: `[Conteúdo do PDF "${file.name}"]\n${pdfText.substring(0, 10000)}\n[Fim do PDF]`
          });
        } catch (err) {
          console.warn('Não foi possível extrair texto do PDF:', err);
          parts.push({ text: `[PDF anexado: ${file.name} - não foi possível extrair o texto]` });
        }
      }
    }

    // Monta o prompt principal
    const systemPrompt = `Você é um assistente especializado em medicina e estudos médicos para estudantes universitários brasileiros.

Suas capacidades:
- Analisar imagens médicas (radiografias, ECGs, histologia, etc.)
- Ler e interpretar documentos PDF (cronogramas, artigos, casos clínicos)
- Ajudar com PBL (Problem-Based Learning)
- Criar flashcards e resumos
- Montar cronogramas de estudo
- Responder dúvidas médicas de forma didática

IMPORTANTE: Quando o usuário enviar imagens ou PDFs, analise-os detalhadamente e responda com base no conteúdo real do arquivo.

${context ? `Contexto adicional: ${context}` : ''}`;

    parts.push({ text: `${systemPrompt}\n\nUsuário: ${message || 'Analise o(s) arquivo(s) acima e me diga o que você vê.'}` });

    const result = await model.generateContent(parts);
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
    return {
      success: false,
      error: error.message,
      response: `Desculpe, ocorreu um erro ao processar sua mensagem: ${error.message}`
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
  const prompt = `Resuma o seguinte texto em no máximo ${maxLength} palavras, mantendo as informações mais importantes:\n\n${text}`;
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
  generateText,
  chatWithAI,
  getStudySuggestions,
  analyzePBL,
  generateFlashcards,
  createSmartSchedule,
  summarizeText,
  answerMedicalQuestion
};
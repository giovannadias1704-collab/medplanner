import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurações globais
const CONFIG = {
  MODEL: 'gemini-2.0-flash-exp',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_BACKOFF: 1000,
  CACHE_EXPIRATION: 60 * 60 * 1000,
  RATE_LIMIT_WINDOW: 60 * 1000,
  MAX_REQUESTS_PER_WINDOW: 10,
  MAX_HISTORY_SIZE: 50,
  MAX_INPUT_LENGTH: 8000,
  MAX_FILE_SIZE: 20 * 1024 * 1024,
  SYSTEM_PROMPT: `Você é um assistente para MedPlanner, app para estudantes de Medicina.

INTENÇÕES PRINCIPAIS:
- ADD_BILL: Conta/fatura médica. JSON: {type: 'bill', amount: number, description: string, date: string}
- ADD_EVENT: Evento (consulta, aula). JSON: {type: 'event', title: string, date: string, time: string}
- ADD_TASK: Tarefa de estudo. JSON: {type: 'task', title: string, dueDate: string, priority: 'low|med|high'}
- ADD_HOME_TASK: Tarefa doméstica. JSON: {type: 'home_task', title: string, dueDate: string}
- LOG_WATER: Água ingerida. JSON: {type: 'water', amount: number, time: string}
- NONE: Conversa normal.

Responda em Português Brasileiro. Para intenções, retorne JSON válido no início.`
};

class GeminiValidation {
  static validateApiKey(key) {
    if (!key || typeof key !== 'string' || key.length < 10) {
      throw new Error('API Key inválida ou ausente');
    }
    return true;
  }

  static validateInput(text) {
    if (typeof text !== 'string') throw new Error('Entrada deve ser string');
    if (text.length > CONFIG.MAX_INPUT_LENGTH) throw new Error('Entrada muito longa');
    if (!text.trim()) throw new Error('Entrada vazia');
    return text.trim();
  }

  static validateFile(file) {
    if (!file || !(file instanceof File)) throw new Error('Arquivo inválido');
    if (file.size > CONFIG.MAX_FILE_SIZE) throw new Error('Arquivo muito grande');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) throw new Error('Tipo de arquivo não suportado');
    return file;
  }

  static sanitizeData(data) {
    if (typeof data === 'string') {
      return data.replace(/[<>]/g, '').trim();
    }
    if (typeof data === 'object') {
      const sanitized = {};
      for (const [k, v] of Object.entries(data)) {
        sanitized[k] = this.sanitizeData(v);
      }
      return sanitized;
    }
    return data;
  }

  static isLocalStorageAvailable() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }
}

class GeminiCache {
  constructor() {
    this.prefix = 'gemini_cache_';
    this.cleanup();
  }

  cleanup() {
    if (!GeminiValidation.isLocalStorageAvailable()) return;
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      const now = Date.now();
      keys.forEach(key => {
        const item = JSON.parse(localStorage.getItem(key));
        if (now - item.timestamp > CONFIG.CACHE_EXPIRATION) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Falha na limpeza de cache:', e);
    }
  }

  get(key) {
    if (!GeminiValidation.isLocalStorageAvailable()) return null;
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > CONFIG.CACHE_EXPIRATION) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  set(key, data) {
    if (!GeminiValidation.isLocalStorageAvailable()) return;
    try {
      const item = {
        data: GeminiValidation.sanitizeData(data),
        timestamp: Date.now()
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      console.warn('Falha ao salvar cache:', e);
    }
  }

  clear() {
    if (!GeminiValidation.isLocalStorageAvailable()) return;
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Falha ao limpar cache:', e);
    }
  }

  getHistory(userId = 'default') {
    const key = `history_${userId}`;
    const history = this.get(key) || [];
    return history.slice(-CONFIG.MAX_HISTORY_SIZE);
  }

  updateHistory(userId, message) {
    const key = `history_${userId}`;
    let history = this.getHistory(userId);
    history.push(message);
    if (history.length > CONFIG.MAX_HISTORY_SIZE * 2) {
      history = history.slice(-CONFIG.MAX_HISTORY_SIZE);
    }
    this.set(key, history);
  }
}

class GeminiRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  canProceed(actionType) {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT_WINDOW;

    if (this.requests.has(actionType)) {
      const reqs = this.requests.get(actionType);
      this.requests.set(actionType, reqs.filter(ts => ts > windowStart));
    }

    const count = this.requests.get(actionType)?.length || 0;
    if (count >= CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    if (!this.requests.has(actionType)) {
      this.requests.set(actionType, []);
    }
    this.requests.get(actionType).push(now);
    return true;
  }

  getStats(actionType) {
    return {
      count: this.requests.get(actionType)?.length || 0,
      window: CONFIG.RATE_LIMIT_WINDOW
    };
  }
}

class GeminiService {
  constructor() {
    this.apiKey = this._getApiKey();
    this.genAI = null;
    this.cache = new GeminiCache();
    this.rateLimiter = new GeminiRateLimiter();
    this.stats = {
      totalRequests: 0,
      successful: 0,
      failed: 0,
      totalTokens: 0,
      avgResponseTime: 0
    };
    this.logs = [];
    this.userContext = {};
    this.init();
  }

  init() {
    try {
      GeminiValidation.validateApiKey(this.apiKey);
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this._log('GeminiService inicializado com sucesso');
    } catch (e) {
      this._log(`Falha na inicialização: ${e.message}`, 'ERROR');
      this.genAI = null;
    }
  }

  _getApiKey() {
    let key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key && GeminiValidation.isLocalStorageAvailable()) {
      key = localStorage.getItem('gemini_api_key');
    }
    if (!key) {
      key = prompt('Insira sua API Key do Gemini:');
      if (key && GeminiValidation.isLocalStorageAvailable()) {
        localStorage.setItem('gemini_api_key', key);
      }
    }
    return key || '';
  }

  _log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.logs.push(logEntry);
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
    console[level.toLowerCase() === 'error' ? 'error' : 'log'](`[Gemini ${level}] ${message}`);
  }

  _getHistory(userId = 'default') {
    return this.cache.getHistory(userId);
  }

  _updateHistory(userId, role, content) {
    const message = { role, content, timestamp: Date.now() };
    this.cache.updateHistory(userId, message);
  }

  _validateInput(input, allowFiles = false) {
    GeminiValidation.validateInput(input);
    if (allowFiles && input.files) {
      if (!Array.isArray(input.files)) throw new Error('Files deve ser array');
      input.files.forEach(GeminiValidation.validateFile);
    }
  }

  _parseResponse(response) {
    try {
      const text = response.response.text();
      const parsed = JSON.parse(text);
      return { parsed, raw: text };
    } catch (e) {
      return { parsed: null, raw: response.response.text() };
    }
  }

  async _generateWithRetry(prompt, options = {}, retries = 0) {
    const startTime = performance.now();
    try {
      if (!this.genAI) throw new Error('Gemini não inicializado');

      const model = this.genAI.getGenerativeModel({ model: CONFIG.MODEL });
      const history = this._getHistory(options.userId);

      let contents = [{ role: 'user', parts: [{ text: prompt }] }];
      if (history.length) {
        contents = contents.concat(history.map(h => ({ role: h.role, parts: [{ text: h.content }] })));
      }

      const result = await model.generateContent(contents, {
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          timeout: CONFIG.TIMEOUT
        }
      });

      const response = await Promise.race([
        result.response,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), CONFIG.TIMEOUT)
        )
      ]);

      const parsed = this._parseResponse({ response });
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.stats.totalRequests++;
      this.stats.successful++;
      this.stats.avgResponseTime = (this.stats.avgResponseTime * (this.stats.totalRequests - 1) + duration) / this.stats.totalRequests;

      this._log(`Resposta gerada em ${duration.toFixed(2)}ms`);

      const cacheKey = btoa(prompt).slice(0, 50);
      this.cache.set(cacheKey, parsed);

      return parsed;

    } catch (error) {
      this.stats.failed++;
      this._log(`Erro na geração (tentativa ${retries + 1}): ${error.message}`, 'ERROR');

      if (retries < CONFIG.MAX_RETRIES) {
        const backoff = CONFIG.RETRY_BACKOFF * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this._generateWithRetry(prompt, options, retries + 1);
      }

      const cacheKey = btoa(prompt).slice(0, 50);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this._log('Usando resposta em cache');
        return cached;
      }

      return {
        parsed: { intention: 'NONE', data: {} },
        raw: 'Desculpe, estou offline. Verifique a conexão.'
      };
    }
  }

  async chatWithAI(input, options = {}) {
    try {
      this._validateInput(input, true);
      const actionType = 'chat';
      if (!this.rateLimiter.canProceed(actionType)) {
        throw new Error('Rate limit excedido para chat');
      }

      const prompt = `${CONFIG.SYSTEM_PROMPT}\n\nUsuário: ${input.text || input}\nAssistente: `;
      const response = await this._generateWithRetry(prompt, { ...options, files: input.files });

      this._updateHistory(options.userId, 'user', input.text || input);
      this._updateHistory(options.userId, 'assistant', response.raw);

      this._log(`Chat concluído com intenção: ${response.parsed?.intention || 'NONE'}`);
      return response;

    } catch (e) {
      this._log(`Erro em chatWithAI: ${e.message}`, 'ERROR');
      throw e;
    }
  }

  async generateFlashcards(topic, options = {}) {
    try {
      GeminiValidation.validateInput(topic);
      const actionType = 'flashcards';
      if (!this.rateLimiter.canProceed(actionType)) {
        throw new Error('Rate limit para flashcards');
      }

      const prompt = `Gere 10 flashcards ANKI para Medicina sobre: ${topic}. Formato JSON: [{front: '', back: ''}]`;
      const response = await this._generateWithRetry(prompt, options);

      return response.parsed || [];

    } catch (e) {
      this._log(`Erro em generateFlashcards: ${e.message}`, 'ERROR');
      return [];
    }
  }

  async createSchedule(tasks, options = {}) {
    try {
      if (!Array.isArray(tasks)) throw new Error('Tasks deve ser array');
      const actionType = 'schedule';
      if (!this.rateLimiter.canProceed(actionType)) {
        throw new Error('Rate limit para schedule');
      }

      const taskList = JSON.stringify(tasks);
      const prompt = `Crie um horário otimizado para estudante de Medicina com estas tarefas: ${taskList}. Retorne JSON: {schedule: [{time: '', task: ''}], tips: ''}`;
      const response = await this._generateWithRetry(prompt, options);

      return response.parsed || { schedule: [], tips: '' };

    } catch (e) {
      this._log(`Erro em createSchedule: ${e.message}`, 'ERROR');
      return { schedule: [], tips: 'Use horários fixos manualmente.' };
    }
  }

  async analyzePBL(pblText, options = {}) {
    try {
      GeminiValidation.validateInput(pblText);
      const actionType = 'pbl';
      if (!this.rateLimiter.canProceed(actionType)) {
        throw new Error('Rate limit para PBL');
      }

      const prompt = `Analise este PBL de Medicina: ${pblText}. Estruture: {problema: '', hipoteses: [], exames: [], tratamento: '', aprendizado: []}`;
      const response = await this._generateWithRetry(prompt, options);

      return response.parsed || {};

    } catch (e) {
      this._log(`Erro em analyzePBL: ${e.message}`, 'ERROR');
      return {};
    }
  }

  async generateText(prompt, options = {}) {
    try {
      GeminiValidation.validateInput(prompt);
      const actionType = 'generate';
      if (!this.rateLimiter.canProceed(actionType)) {
        throw new Error('Rate limit para generateText');
      }

      const fullPrompt = `${CONFIG.SYSTEM_PROMPT}\nGere texto sobre: ${prompt}`;
      const response = await this._generateWithRetry(fullPrompt, options);

      return response.raw;

    } catch (e) {
      this._log(`Erro em generateText: ${e.message}`, 'ERROR');
      return 'Erro na geração.';
    }
  }

  getGeminiStats() {
    try {
      return {
        ...this.stats,
        rateLimits: {
          chat: this.rateLimiter.getStats('chat'),
          flashcards: this.rateLimiter.getStats('flashcards'),
          schedule: this.rateLimiter.getStats('schedule'),
          pbl: this.rateLimiter.getStats('pbl')
        },
        apiKeyValid: !!this.genAI,
        logsCount: this.logs.length
      };
    } catch (e) {
      this._log(`Erro em getGeminiStats: ${e.message}`, 'ERROR');
      return {};
    }
  }

  getLogs() {
    try {
      return this.logs.slice(-100);
    } catch (e) {
      return [];
    }
  }

  clearLogs() {
    try {
      this.logs = [];
      this._log('Logs limpos');
    } catch (e) {
      this._log(`Erro ao limpar logs: ${e.message}`, 'ERROR');
    }
  }

  clearCache() {
    try {
      this.cache.clear();
      this._log('Cache limpo');
    } catch (e) {
      this._log(`Erro ao limpar cache: ${e.message}`, 'ERROR');
    }
  }

  setUserContext(context) {
    try {
      this.userContext = GeminiValidation.sanitizeData(context);
      this._log('Contexto do usuário atualizado');
    } catch (e) {
      this._log(`Erro ao setUserContext: ${e.message}`, 'ERROR');
    }
  }

  async checkOnline() {
    try {
      if (!navigator.onLine) return false;
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        signal: controller.signal
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

const geminiService = new GeminiService();

export default geminiService;
export { GeminiService, GeminiCache, GeminiRateLimiter, GeminiValidation };
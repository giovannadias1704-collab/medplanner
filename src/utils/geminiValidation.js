/**
 * Módulo de validação para requisições Gemini.
 */

export const MAX_PROMPT_LENGTH = 32000;
export const MAX_MESSAGE_LENGTH = 8000;
export const MAX_HISTORY_LENGTH = 20;
export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

/**
 * Valida prompt.
 * @param {string} prompt
 * @throws {Error}
 * @returns {boolean}
 */
export function validatePrompt(prompt) {
  if (typeof prompt !== 'string') {
    throw new Error('Prompt deve ser uma string');
  }
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    throw new Error('Prompt não pode estar vazio');
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt muito longo: ${prompt.length}/${MAX_PROMPT_LENGTH} caracteres`);
  }
  return true;
}

/**
 * Valida mensagem de chat.
 * @param {string} message
 * @throws {Error}
 * @returns {boolean}
 */
export function validateMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Mensagem deve ser uma string');
  }
  if (message.trim().length === 0) {
    throw new Error('Mensagem não pode estar vazia');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Mensagem muito longa: ${message.length}/${MAX_MESSAGE_LENGTH}`);
  }
  return true;
}

/**
 * Valida arquivos.
 * @param {File[]} files
 * @throws {Error}
 * @returns {boolean}
 */
export function validateFiles(files) {
  if (!Array.isArray(files)) {
    throw new Error('Files deve ser um array');
  }
  if (files.length > MAX_FILES) {
    throw new Error(`Excesso de arquivos: ${files.length}/${MAX_FILES}`);
  }
  files.forEach((file, i) => {
    if (!(file instanceof File)) {
      throw new Error(`Item ${i} não é um File`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo ${file.name} muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Tipo inválido para ${file.name}: ${file.type}`);
    }
  });
  return true;
}

/**
 * Sanitiza prompt removendo conteúdo perigoso.
 * @param {string} prompt
 * @returns {string}
 */
export function sanitizePrompt(prompt) {
  return prompt
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .substring(0, MAX_PROMPT_LENGTH);
}

/**
 * Valida dados de ação.
 * @param {string} action
 * @param {object} data
 * @throws {Error}
 * @returns {boolean}
 */
export function validateActionData(action, data) {
  const { prompt = '', history = [], files = [] } = data;
  switch (action) {
    case 'chat':
    case 'default':
      validatePrompt(prompt);
      if (history.length > MAX_HISTORY_LENGTH) {
        throw new Error(`Histórico muito longo: ${history.length}/${MAX_HISTORY_LENGTH}`);
      }
      validateFiles(files);
      break;
    case 'flashcards':
      validatePrompt(prompt);
      break;
    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
  return true;
}
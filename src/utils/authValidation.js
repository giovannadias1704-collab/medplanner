/**
 * Módulo de validação para autenticação.
 * Todas as funções são independentes, sem dependências externas.
 */

/**
 * Valida um endereço de email usando regex padrão.
 * @param {string} email - O email a ser validado.
 * @returns {boolean} true se válido, false caso contrário.
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida senha: mínimo 8 caracteres e pelo menos um número.
 * @param {string} password - A senha a ser validada.
 * @returns {boolean} true se válida, false caso contrário.
 */
export function validatePassword(password) {
  return password.length >= 8 && /\d/.test(password);
}

/**
 * Valida nome de exibição: mínimo 3 caracteres.
 * @param {string} name - O nome de exibição.
 * @returns {boolean} true se válido, false caso contrário.
 */
export function validateDisplayName(name) {
  return name.trim().length >= 3;
}

/**
 * Sanitiza entrada removendo caracteres perigosos (XSS básico).
 * @param {string} input - Entrada a sanitizar.
 * @returns {string} Entrada sanitizada.
 */
export function sanitizeInput(input) {
  return String(input).replace(/[<>%&"']/g, '').trim();
}

/**
 * Avalia força da senha e retorna nível.
 * @param {string} password - Senha a avaliar.
 * @returns {'fraco' | 'médio' | 'forte'} Nível de força.
 */
export function validatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 4) return 'forte';
  if (score >= 3) return 'médio';
  return 'fraco';
}
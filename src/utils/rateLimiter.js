/**
 * Rate Limiter client-side usando localStorage para persistência.
 * Bloqueia após 5 tentativas erradas por 10 minutos.
 */

class RateLimiter {
  /**
   * @param {number} [maxAttempts=5] - Máximo de tentativas.
   * @param {number} [blockDurationMs=600000] - Duração do bloqueio em ms (10 min).
   */
  constructor(maxAttempts = 5, blockDurationMs = 10 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.blockDurationMs = blockDurationMs;
  }

  /**
   * Registra tentativa. Retorna false se bloqueado.
   * @param {string} identifier - Identificador (ex: email).
   * @returns {boolean} true se tentativa permitida.
   */
  recordAttempt(identifier) {
    const key = `rateLimiter_${btoa(identifier)}`; // base64 para chave segura
    const now = Date.now();
    let data = JSON.parse(localStorage.getItem(key) || '{}');

    if (data.blockedUntil && data.blockedUntil > now) {
      return false;
    }

    data.attempts = (data.attempts || 0) + 1;
    data.lastAttempt = now;

    if (data.attempts > this.maxAttempts) {
      data.blockedUntil = now + this.blockDurationMs;
    }

    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }

  /**
   * Verifica se está bloqueado.
   * @param {string} identifier - Identificador.
   * @returns {boolean}
   */
  isBlocked(identifier) {
    const key = `rateLimiter_${btoa(identifier)}`;
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return data.blockedUntil > Date.now();
  }

  /**
   * Retorna timestamp de desbloqueio.
   * @param {string} identifier - Identificador.
   * @returns {number|null}
   */
  getBlockedUntil(identifier) {
    const key = `rateLimiter_${btoa(identifier)}`;
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return data.blockedUntil || null;
  }

  /**
   * Reseta tentativas.
   * @param {string} identifier - Identificador.
   */
  reset(identifier) {
    const key = `rateLimiter_${btoa(identifier)}`;
    localStorage.removeItem(key);
  }
}

export default RateLimiter;